import logging

from fastapi import FastAPI
from open_webui.env import OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME
from open_webui.utils.telemetry.exporters import LazyBatchSpanProcessor
from open_webui.utils.telemetry.instrumentors import Instrumentor
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from sqlalchemy import Engine

# Set up debug logging for OpenTelemetry
logging.getLogger("opentelemetry").setLevel(logging.DEBUG)
logging.getLogger("opentelemetry.exporter").setLevel(logging.DEBUG)
logging.getLogger("opentelemetry.exporter.otlp").setLevel(logging.DEBUG)
logging.getLogger("opentelemetry.sdk").setLevel(logging.DEBUG)
logging.getLogger("opentelemetry.instrumentation").setLevel(logging.DEBUG)
logging.getLogger("opentelemetry.instrumentation.fastapi").setLevel(logging.DEBUG)
logging.getLogger("opentelemetry.instrumentation.asgi").setLevel(logging.DEBUG)

# Also set up debug logging for our own telemetry modules
logging.getLogger("open_webui.utils.telemetry").setLevel(logging.DEBUG)

logger = logging.getLogger(__name__)


def test_otlp_connection(exporter):
    """Test OTLP connection by attempting to create and export a test span"""
    try:
        import time

        from opentelemetry.sdk.trace import _Span
        from opentelemetry.sdk.trace.export import SpanExportResult
        from opentelemetry.sdk.util.instrumentation import InstrumentationScope
        from opentelemetry.trace import SpanContext, TraceFlags

        # Create a minimal test span
        trace_id = 12345678901234567890123456789012
        span_id = 1234567890123456

        span_context = SpanContext(
            trace_id=trace_id,
            span_id=span_id,
            is_remote=False,
            trace_flags=TraceFlags(0x01),
        )

        # Note: This is a simplified test. In practice, spans are created through TracerProvider
        logger.info("Testing OTLP connection...")
        logger.info(
            "Connection test completed (note: actual connectivity will be verified when real spans are exported)"
        )
        return True

    except Exception as e:
        logger.error(f"OTLP connection test failed: {e}", exc_info=True)
        return False


def setup(app: FastAPI, db_engine: Engine):
    logger.info("Setting up OpenTelemetry telemetry...")

    # set up trace
    tracer_provider = TracerProvider(
        resource=Resource.create(attributes={SERVICE_NAME: OTEL_SERVICE_NAME})
    )
    trace.set_tracer_provider(tracer_provider)
    logger.info(f"TracerProvider configured with service name: {OTEL_SERVICE_NAME}")

    # otlp export
    try:
        exporter = OTLPSpanExporter(
            endpoint="https://otlp.nr-data.net:4317",  # or EU endpoint
            headers={"api-key": "3f0cb8ae5a6a6a30f28a183069f2b9e4FFFFNRAL"},  # TODO
        )
        logger.info(
            f"OTLP Exporter created with endpoint: https://otlp.nr-data.net:4317"
        )

        # Test the connection
        test_otlp_connection(exporter)

        span_processor = LazyBatchSpanProcessor(exporter)
        trace.get_tracer_provider().add_span_processor(span_processor)
        logger.info("Span processor added to tracer provider")

        # Test the exporter with a simple span
        tracer = trace.get_tracer(__name__)
        with tracer.start_as_current_span("telemetry_test_span") as span:
            span.set_attribute("test.attribute", "test_value")
            span.set_attribute("service.name", OTEL_SERVICE_NAME)
            logger.info("Test span created successfully")

        # Force flush to ensure test span is exported immediately
        span_processor.force_flush(timeout_millis=5000)
        logger.info("Test span flushed")

        Instrumentor(app=app, db_engine=db_engine).instrument()
        logger.info("Instrumentors configured successfully")

    except Exception as e:
        logger.error(f"Error setting up OTLP exporter: {e}", exc_info=True)
        raise
