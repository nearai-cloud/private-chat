import json
import logging
from typing import Optional

import requests
from open_webui.env import SRC_LOG_LEVELS
from open_webui.retrieval.web.main import SearchResult, get_filtered_results

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["RAG"])


def search_brave(
    api_key: str, query: str, count: int, filter_list: Optional[list[str]] = None
) -> list[SearchResult]:
    """Search using Brave's Chat Completions API and return the results as a list of SearchResult objects.

    Args:
        api_key (str): A Brave Search API key
        query (str): The query to search for
        count (int): Number of results to return
        filter_list (Optional[list[str]]): Optional list of domains to filter
    """
    url = "https://api.search.brave.com/res/v1/chat/completions"
    headers = {
        "Accept": "text/event-stream",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": api_key,
        "Content-Type": "application/json",
    }

    # Prepare the request body for chat completions with streaming and citations enabled
    payload = {
        "stream": True,
        "enable_citations": True,
        "messages": [{"role": "user", "content": query}],
    }

    response = requests.post(url, headers=headers, json=payload, stream=True)
    response.raise_for_status()

    # Process streaming response
    citations = []
    content_parts = []
    main_content_parts = []  # For main content display (citations as [number])

    for line in response.iter_lines(decode_unicode=True):
        if line.startswith("data: "):
            data_str = line[6:]  # Remove "data: " prefix
            if data_str.strip() == "[DONE]":
                break

            try:
                data = json.loads(data_str)

                if choices := data.get("choices", []):
                    if delta := choices[0].get("delta", {}).get("content"):
                        if delta.startswith("<citation>") and delta.endswith(
                            "</citation>"
                        ):
                            # Parse citation - Brave API specific
                            citation_json = delta.removeprefix(
                                "<citation>"
                            ).removesuffix("</citation>")
                            citation = json.loads(citation_json)
                            citations.append(citation)
                            citation_ref = f"[{citation['number']}]"
                            main_content_parts.append(citation_ref)
                            print(citation_ref, end="", flush=True)
                        elif delta.startswith("<enum_item>") and delta.endswith(
                            "</enum_item>"
                        ):
                            # Handle enum items - Brave API specific
                            item_json = delta.removeprefix("<enum_item>").removesuffix(
                                "</enum_item>"
                            )
                            item = json.loads(item_json)
                            enum_display = f"* {item.get('original_tokens', '')}"
                            content_parts.append(enum_display)
                            main_content_parts.append(enum_display)
                            print(enum_display, end="", flush=True)
                        elif delta.startswith("<enum_start>") and delta.endswith(
                            "</enum_start>"
                        ):
                            # Start of enumeration - Brave API specific
                            pass
                        elif delta.startswith("<enum_end>") and delta.endswith(
                            "</enum_end>"
                        ):
                            # End of enumeration - Brave API specific
                            pass
                        elif delta.startswith("<usage>") and delta.endswith("</usage>"):
                            # Usage information - OpenAI standard metadata
                            usage_json = delta.removeprefix("<usage>").removesuffix(
                                "</usage>"
                            )
                            usage = json.loads(usage_json)
                            print(f"\n\nUsage: {usage}")
                        else:
                            # Regular content - actual LLM response
                            content_parts.append(delta)
                            main_content_parts.append(delta)
                            print(delta, end="", flush=True)

            except json.JSONDecodeError as e:
                log.error(f"Failed to parse streaming JSON: {e}")
                continue

    # Debug: Print structured response
    print("\n\n=== STRUCTURED RESPONSE DEBUG ===")
    print("# 返回主体内容")
    print("".join(main_content_parts))

    if citations:
        print("\n# Citations")
        for i, citation in enumerate(citations, 1):
            print(f"{i}. Citation {citation.get('number', i)}")
            print(f"    - Link: {citation.get('url', 'N/A')}")
            print(f"    - Title: {citation.get('snippet', 'N/A')[:100]}...")
            print(f"    - Content: {citation.get('snippet', 'N/A')}")
            print()

    print("=== END STRUCTURED RESPONSE DEBUG ===")

    # Build content from parts
    content = "".join(content_parts)
    main_content = "".join(main_content_parts)

    # Create SearchResult objects - main content + citations
    results = []

    # Add main content result if there's any content
    # if main_content.strip():
    #     main_result = SearchResult(
    #         link="https://search.brave.com/",
    #         title="Brave Search Results",
    #         snippet=main_content,
    #     )
    #     results.append(main_result)

    # Add citation results
    for citation in citations:
        citation_result = SearchResult(
            link=citation.get("url", ""),
            title=f"Citation {citation.get('number', '')}: {citation.get('snippet', '')[:100]}...",
            snippet=citation.get("snippet", ""),
        )
        results.append(citation_result)
        log.debug(f"Created citation result: {citation_result.link}")

    return results
