import asyncio
import inspect
import json
import logging
import random
import re
import sys
import time
import uuid
from typing import Any, Optional

from aiocache import cached
from fastapi import HTTPException, Request, status
from open_webui.env import BYPASS_MODEL_ACCESS_CONTROL, GLOBAL_LOG_LEVEL, SRC_LOG_LEVELS
from open_webui.functions import generate_function_chat_completion
from open_webui.models.functions import Functions
from open_webui.models.models import Models
from open_webui.models.users import UserModel
from open_webui.routers.ollama import (
    generate_chat_completion as generate_ollama_chat_completion,
)
from open_webui.routers.openai import (
    generate_chat_completion as generate_openai_chat_completion,
)
from open_webui.routers.pipelines import (
    process_pipeline_inlet_filter,
    process_pipeline_outlet_filter,
)
from open_webui.socket.main import get_event_call, get_event_emitter, sio
from open_webui.utils.filter import get_sorted_filter_ids, process_filter_functions
from open_webui.utils.models import check_model_access, get_all_models
from open_webui.utils.payload import convert_payload_openai_to_ollama
from open_webui.utils.plugin import load_function_module_by_id
from open_webui.utils.response import (
    convert_response_ollama_to_openai,
    convert_streaming_response_ollama_to_openai,
)
from starlette.responses import JSONResponse, Response, StreamingResponse

logging.basicConfig(stream=sys.stdout, level=GLOBAL_LOG_LEVEL)
log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MAIN"])


def reduce_search_results_in_files(form_data: dict) -> dict:
    """
    Reduce web search results in form_data by removing half of the <source> tags from message content.

    Args:
        form_data: The chat completion form data containing messages with search results

    Returns:
        Modified form_data with reduced search results
    """
    try:
        reduced_count = 0

        # Check messages for <source> tags
        if "messages" in form_data:
            messages = form_data["messages"]

            for i, msg in enumerate(messages):
                if (
                    isinstance(msg, dict)
                    and "content" in msg
                    and isinstance(msg["content"], str)
                ):
                    content = msg["content"]

                    # Find all <source> tags
                    source_pattern = r"<source[^>]*>.*?</source>"
                    sources = re.findall(source_pattern, content, re.DOTALL)

                    if len(sources) > 1:
                        # Keep only half of the sources
                        sources_to_keep = max(1, len(sources) // 2)

                        # Remove the sources we don't want to keep
                        sources_to_remove = sources[sources_to_keep:]

                        # Remove each source from content
                        new_content = content
                        for source_to_remove in sources_to_remove:
                            # Escape special regex characters in the source content
                            escaped_source = re.escape(source_to_remove)
                            new_content = re.sub(
                                escaped_source, "", new_content, count=1
                            )

                        # Clean up extra whitespace
                        new_content = re.sub(r"\n\s*\n\s*\n", "\n\n", new_content)
                        new_content = new_content.strip()

                        msg["content"] = new_content
                        reduced_count += len(sources_to_remove)

                        log.warning(
                            f"Removed {len(sources_to_remove)} sources from message {i}"
                        )

        # Also check metadata.files if they exist
        if "metadata" in form_data and "files" in form_data["metadata"]:
            files = form_data["metadata"]["files"]
            if files is not None and isinstance(files, list):
                for i, file in enumerate(files):
                    if (
                        isinstance(file, dict)
                        and file.get("type") == "web_search"
                        and "docs" in file
                    ):
                        original_count = len(file["docs"])
                        if original_count > 1:
                            reduced_file_count = max(1, original_count // 2)
                            file["docs"] = file["docs"][:reduced_file_count]
                            reduced_count += original_count - reduced_file_count

        if reduced_count > 0:
            log.warning(f"Successfully reduced {reduced_count} search results")

        return form_data
    except Exception as e:
        log.error(f"Error reducing search results: {e}")
        return form_data


async def generate_direct_chat_completion(
    request: Request,
    form_data: dict,
    user: Any,
    models: dict,
):
    start_time = time.time()

    metadata = form_data.pop("metadata", {})

    user_id = metadata.get("user_id")
    session_id = metadata.get("session_id")
    request_id = str(uuid.uuid4())  # Generate a unique request ID

    event_caller = get_event_call(metadata)

    channel = f"{user_id}:{session_id}:{request_id}"

    if form_data.get("stream"):
        q = asyncio.Queue()

        async def message_listener(sid, data):
            """
            Handle received socket messages and push them into the queue.
            """
            await q.put(data)

        # Register the listener
        sio.on(channel, message_listener)

        # Start processing chat completion in background
        res = await event_caller(
            {
                "type": "request:chat:completion",
                "data": {
                    "form_data": form_data,
                    "model": models[form_data["model"]],
                    "channel": channel,
                    "session_id": session_id,
                },
            }
        )

        log.info(f"res: {res}")

        if res.get("status", False):
            # Define a generator to stream responses
            async def event_generator():
                nonlocal q
                try:
                    while True:
                        data = await q.get()  # Wait for new messages
                        if isinstance(data, dict):
                            if "done" in data and data["done"]:
                                break  # Stop streaming when 'done' is received

                            yield f"data: {json.dumps(data)}\n\n"
                        elif isinstance(data, str):
                            yield data
                except Exception as e:
                    log.debug(f"Error in event generator: {e}")
                    pass

            # Define a background task to run the event generator
            async def background():
                try:
                    del sio.handlers["/"][channel]
                except Exception as e:
                    pass

            # Return the streaming response
            return StreamingResponse(
                event_generator(), media_type="text/event-stream", background=background
            )
        else:
            raise Exception(str(res))
    else:
        res = await event_caller(
            {
                "type": "request:chat:completion",
                "data": {
                    "form_data": form_data,
                    "model": models[form_data["model"]],
                    "channel": channel,
                    "session_id": session_id,
                },
            }
        )

        if "error" in res and res["error"]:
            raise Exception(res["error"])

        return res


async def generate_chat_completion(
    request: Request,
    form_data: dict,
    user: Any,
    bypass_filter: bool = False,
):
    start_time = time.time()
    log.debug(f"generate_chat_completion: {form_data}")
    if BYPASS_MODEL_ACCESS_CONTROL:
        bypass_filter = True

    if hasattr(request.state, "metadata"):
        if "metadata" not in form_data:
            form_data["metadata"] = request.state.metadata
        else:
            form_data["metadata"] = {
                **form_data["metadata"],
                **request.state.metadata,
            }

    if getattr(request.state, "direct", False) and hasattr(request.state, "model"):
        models = {
            request.state.model["id"]: request.state.model,
        }
        log.debug(f"direct connection to model: {models}")
    else:
        models = request.app.state.MODELS

    model_id = form_data["model"]
    if model_id not in models:
        raise Exception("Model not found")

    model = models[model_id]

    if getattr(request.state, "direct", False):
        return await generate_direct_chat_completion(
            request, form_data, user=user, models=models
        )
    else:
        # Check if user has access to the model
        if not bypass_filter and user.role == "user":
            try:
                check_model_access(user, model)
            except Exception as e:
                raise e

        if model.get("owned_by") == "arena":
            model_ids = model.get("info", {}).get("meta", {}).get("model_ids")
            filter_mode = model.get("info", {}).get("meta", {}).get("filter_mode")
            if model_ids and filter_mode == "exclude":
                model_ids = [
                    model["id"]
                    for model in list(request.app.state.MODELS.values())
                    if model.get("owned_by") != "arena" and model["id"] not in model_ids
                ]

            selected_model_id = None
            if isinstance(model_ids, list) and model_ids:
                selected_model_id = random.choice(model_ids)
            else:
                model_ids = [
                    model["id"]
                    for model in list(request.app.state.MODELS.values())
                    if model.get("owned_by") != "arena"
                ]
                selected_model_id = random.choice(model_ids)

            form_data["model"] = selected_model_id

            if form_data.get("stream") == True:

                async def stream_wrapper(stream):
                    yield f"data: {json.dumps({'selected_model_id': selected_model_id})}\n\n"
                    async for chunk in stream:
                        yield chunk

                response = await generate_chat_completion(
                    request, form_data, user, bypass_filter=True
                )

                return StreamingResponse(
                    stream_wrapper(response.body_iterator),
                    media_type="text/event-stream",
                    background=response.background,
                )
            else:
                result = await generate_chat_completion(
                    request, form_data, user, bypass_filter=True
                )

                return {
                    **result,
                    "selected_model_id": selected_model_id,
                }

        if model.get("pipe"):
            # Below does not require bypass_filter because this is the only route the uses this function and it is already bypassing the filter
            result = await generate_function_chat_completion(
                request, form_data, user=user, models=models
            )

            return result

        if model.get("owned_by") == "ollama":
            # Using /ollama/api/chat endpoint
            form_data = convert_payload_openai_to_ollama(form_data)

            response = await generate_ollama_chat_completion(
                request=request,
                form_data=form_data,
                user=user,
                bypass_filter=bypass_filter,
            )

            if form_data.get("stream"):
                response.headers["content-type"] = "text/event-stream"
                return StreamingResponse(
                    convert_streaming_response_ollama_to_openai(response),
                    headers=dict(response.headers),
                    background=response.background,
                )
            else:
                result = convert_response_ollama_to_openai(response)

                return result
        else:
            # Attempt OpenAI chat completion with retry logic for 413 errors
            max_retries = 1
            retry_count = 0
            last_exception = None

            while retry_count <= max_retries:
                try:
                    result = await generate_openai_chat_completion(
                        request=request,
                        form_data=form_data,
                        user=user,
                        bypass_filter=bypass_filter,
                    )
                    return result
                except HTTPException as e:
                    last_exception = e
                    if e.status_code == 413:
                        if retry_count < max_retries:
                            log.warning(
                                f"Received 413 error, attempting retry {retry_count + 1}/{max_retries + 1} with reduced search results"
                            )
                            retry_count += 1

                            # Reduce search results in form_data by half
                            form_data = reduce_search_results_in_files(form_data)

                            continue  # Retry with reduced payload
                        else:
                            log.warning(
                                f"Received 413 error, max retries ({max_retries + 1}) reached"
                            )
                            break
                    else:
                        # Different error, re-raise immediately
                        break

            # If we exit the loop, re-raise the last exception
            if last_exception:
                raise last_exception


chat_completion = generate_chat_completion


async def chat_completed(request: Request, form_data: dict, user: Any):
    if not request.app.state.MODELS:
        await get_all_models(request, user=user)

    if getattr(request.state, "direct", False) and hasattr(request.state, "model"):
        models = {
            request.state.model["id"]: request.state.model,
        }
    else:
        models = request.app.state.MODELS

    data = form_data
    model_id = data["model"]
    if model_id not in models:
        raise Exception("Model not found")

    model = models[model_id]

    try:
        data = await process_pipeline_outlet_filter(request, data, user, models)
    except Exception as e:
        return Exception(f"Error: {e}")

    metadata = {
        "chat_id": data["chat_id"],
        "message_id": data["id"],
        "session_id": data["session_id"],
        "user_id": user.id,
    }

    extra_params = {
        "__event_emitter__": get_event_emitter(metadata),
        "__event_call__": get_event_call(metadata),
        "__user__": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
        },
        "__metadata__": metadata,
        "__request__": request,
        "__model__": model,
    }

    try:
        filter_functions = [
            Functions.get_function_by_id(filter_id)
            for filter_id in get_sorted_filter_ids(model)
        ]

        result, _ = await process_filter_functions(
            request=request,
            filter_functions=filter_functions,
            filter_type="outlet",
            form_data=data,
            extra_params=extra_params,
        )
        return result
    except Exception as e:
        return Exception(f"Error: {e}")


async def chat_action(request: Request, action_id: str, form_data: dict, user: Any):
    if "." in action_id:
        action_id, sub_action_id = action_id.split(".")
    else:
        sub_action_id = None

    action = Functions.get_function_by_id(action_id)
    if not action:
        raise Exception(f"Action not found: {action_id}")

    if not request.app.state.MODELS:
        await get_all_models(request, user=user)

    if getattr(request.state, "direct", False) and hasattr(request.state, "model"):
        models = {
            request.state.model["id"]: request.state.model,
        }
    else:
        models = request.app.state.MODELS

    data = form_data
    model_id = data["model"]

    if model_id not in models:
        raise Exception("Model not found")
    model = models[model_id]

    __event_emitter__ = get_event_emitter(
        {
            "chat_id": data["chat_id"],
            "message_id": data["id"],
            "session_id": data["session_id"],
            "user_id": user.id,
        }
    )
    __event_call__ = get_event_call(
        {
            "chat_id": data["chat_id"],
            "message_id": data["id"],
            "session_id": data["session_id"],
            "user_id": user.id,
        }
    )

    if action_id in request.app.state.FUNCTIONS:
        function_module = request.app.state.FUNCTIONS[action_id]
    else:
        function_module, _, _ = load_function_module_by_id(action_id)
        request.app.state.FUNCTIONS[action_id] = function_module

    if hasattr(function_module, "valves") and hasattr(function_module, "Valves"):
        valves = Functions.get_function_valves_by_id(action_id)
        function_module.valves = function_module.Valves(**(valves if valves else {}))

    if hasattr(function_module, "action"):
        try:
            action = function_module.action

            # Get the signature of the function
            sig = inspect.signature(action)
            params = {"body": data}

            # Extra parameters to be passed to the function
            extra_params = {
                "__model__": model,
                "__id__": sub_action_id if sub_action_id is not None else action_id,
                "__event_emitter__": __event_emitter__,
                "__event_call__": __event_call__,
                "__request__": request,
            }

            # Add extra params in contained in function signature
            for key, value in extra_params.items():
                if key in sig.parameters:
                    params[key] = value

            if "__user__" in sig.parameters:
                __user__ = {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "role": user.role,
                }

                try:
                    if hasattr(function_module, "UserValves"):
                        __user__["valves"] = function_module.UserValves(
                            **Functions.get_user_valves_by_id_and_user_id(
                                action_id, user.id
                            )
                        )
                except Exception as e:
                    log.exception(f"Failed to get user values: {e}")

                params = {**params, "__user__": __user__}

            if inspect.iscoroutinefunction(action):
                data = await action(**params)
            else:
                data = action(**params)

        except Exception as e:
            return Exception(f"Error: {e}")

    return data
