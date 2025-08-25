import logging
import traceback
from typing import Collection, Union

from aiohttp import (TraceRequestEndParams, TraceRequestExceptionParams,
                     TraceRequestStartParams)
from chromadb.telemetry.opentelemetry.fastapi import instrument_fastapi
from fastapi import FastAPI, status
from open_webui.env import SRC_LOG_LEVELS
from open_webui.utils.telemetry.constants import (SPAN_REDIS_TYPE,
                                                  SpanAttributes)
from opentelemetry.instrumentation.aiohttp_client import \
    AioHttpClientInstrumentor
from opentelemetry.instrumentation.httpx import (HTTPXClientInstrumentor,
                                                 RequestInfo, ResponseInfo)
from opentelemetry.instrumentation.instrumentor import BaseInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.trace import Span, StatusCode
from redis import Redis
from requests import PreparedRequest, Response
from sqlalchemy import Engine

logger = logging.getLogger(__name__)
logger.setLevel(SRC_LOG_LEVELS["MAIN"])

# Enable debug logging for instrumentation
logging.getLogger("opentelemetry.instrumentation").setLevel(logging.DEBUG)


def requests_hook(span: Span, request: PreparedRequest):
    """
    Http Request Hook
    """

    span.update_name(f"{request.method} {request.url}")
    span.set_attributes(
        attributes={
            SpanAttributes.HTTP_URL: request.url,
            SpanAttributes.HTTP_METHOD: request.method,
        }
    )


def response_hook(span: Span, request: PreparedRequest, response: Response):
    """
    HTTP Response Hook
    """

    span.set_attributes(
        attributes={
            SpanAttributes.HTTP_STATUS_CODE: response.status_code,
        }
    )
    span.set_status(StatusCode.ERROR if response.status_code >= 400 else StatusCode.OK)


def redis_request_hook(span: Span, instance: Redis, args, kwargs):
    """
    Redis Request Hook
    """

    try:
        connection_kwargs: dict = instance.connection_pool.connection_kwargs
        host = connection_kwargs.get("host")
        port = connection_kwargs.get("port")
        db = connection_kwargs.get("db")
        span.set_attributes(
            {
                SpanAttributes.DB_INSTANCE: f"{host}/{db}",
                SpanAttributes.DB_NAME: f"{host}/{db}",
                SpanAttributes.DB_TYPE: SPAN_REDIS_TYPE,
                SpanAttributes.DB_PORT: port,
                SpanAttributes.DB_IP: host,
                SpanAttributes.DB_STATEMENT: " ".join([str(i) for i in args]),
                SpanAttributes.DB_OPERATION: str(args[0]),
            }
        )
    except Exception:  # pylint: disable=W0718
        logger.error(traceback.format_exc())


def httpx_request_hook(span: Span, request: RequestInfo):
    """
    HTTPX Request Hook
    """

    span.update_name(f"{request.method.decode()} {str(request.url)}")
    span.set_attributes(
        attributes={
            SpanAttributes.HTTP_URL: str(request.url),
            SpanAttributes.HTTP_METHOD: request.method.decode(),
        }
    )


def httpx_response_hook(span: Span, request: RequestInfo, response: ResponseInfo):
    """
    HTTPX Response Hook
    """

    span.set_attribute(SpanAttributes.HTTP_STATUS_CODE, response.status_code)
    span.set_status(
        StatusCode.ERROR
        if response.status_code >= status.HTTP_400_BAD_REQUEST
        else StatusCode.OK
    )


async def httpx_async_request_hook(span: Span, request: RequestInfo):
    """
    Async Request Hook
    """

    httpx_request_hook(span, request)


async def httpx_async_response_hook(
    span: Span, request: RequestInfo, response: ResponseInfo
):
    """
    Async Response Hook
    """

    httpx_response_hook(span, request, response)


def aiohttp_request_hook(span: Span, request: TraceRequestStartParams):
    """
    Aiohttp Request Hook
    """

    span.update_name(f"{request.method} {str(request.url)}")
    span.set_attributes(
        attributes={
            SpanAttributes.HTTP_URL: str(request.url),
            SpanAttributes.HTTP_METHOD: request.method,
        }
    )


def aiohttp_response_hook(
    span: Span, response: Union[TraceRequestExceptionParams, TraceRequestEndParams]
):
    """
    Aiohttp Response Hook
    """

    if isinstance(response, TraceRequestEndParams):
        span.set_attribute(SpanAttributes.HTTP_STATUS_CODE, response.response.status)
        span.set_status(
            StatusCode.ERROR
            if response.response.status >= status.HTTP_400_BAD_REQUEST
            else StatusCode.OK
        )
    elif isinstance(response, TraceRequestExceptionParams):
        span.set_status(StatusCode.ERROR)
        span.set_attribute(SpanAttributes.ERROR_MESSAGE, str(response.exception))


class Instrumentor(BaseInstrumentor):
    """
    Instrument OT
    """

    def __init__(self, app: FastAPI, db_engine: Engine):
        self.app = app
        self.db_engine = db_engine

    def instrumentation_dependencies(self) -> Collection[str]:
        return []

    def _instrument(self, **kwargs):
        logger.info("Starting instrumentation of components...")
        
        try:
            logger.debug("Instrumenting FastAPI...")
            instrument_fastapi(app=self.app)
            logger.debug("FastAPI instrumentation completed")
            
            logger.debug("Instrumenting SQLAlchemy...")
            SQLAlchemyInstrumentor().instrument(engine=self.db_engine)
            logger.debug("SQLAlchemy instrumentation completed")
            
            logger.debug("Instrumenting Redis...")
            RedisInstrumentor().instrument(request_hook=redis_request_hook)
            logger.debug("Redis instrumentation completed")
            
            logger.debug("Instrumenting Requests...")
            RequestsInstrumentor().instrument(
                request_hook=requests_hook, response_hook=response_hook
            )
            logger.debug("Requests instrumentation completed")
            
            logger.debug("Instrumenting Logging...")
            LoggingInstrumentor().instrument()
            logger.debug("Logging instrumentation completed")
            
            logger.debug("Instrumenting HTTPX...")
            HTTPXClientInstrumentor().instrument(
                request_hook=httpx_request_hook,
                response_hook=httpx_response_hook,
                async_request_hook=httpx_async_request_hook,
                async_response_hook=httpx_async_response_hook,
            )
            logger.debug("HTTPX instrumentation completed")
            
            logger.debug("Instrumenting AioHttp...")
            AioHttpClientInstrumentor().instrument(
                request_hook=aiohttp_request_hook,
                response_hook=aiohttp_response_hook,
            )
            logger.debug("AioHttp instrumentation completed")
            
            logger.info("All instrumentation completed successfully")
            
        except Exception as e:
            logger.error(f"Error during instrumentation: {e}", exc_info=True)
            raise

    def _uninstrument(self, **kwargs):
        if getattr(self, "instrumentors", None) is None:
            return
        for instrumentor in self.instrumentors:
            instrumentor.uninstrument()
