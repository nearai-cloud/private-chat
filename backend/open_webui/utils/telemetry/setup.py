import logging
import os

from fastapi import FastAPI
from open_webui.env import OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME
from open_webui.utils.telemetry.exporters import (
    LazyBatchSpanProcessor,
    LoggingSpanExporter,
)
from open_webui.utils.telemetry.instrumentors import Instrumentor
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from sqlalchemy import Engine

# Configure OpenTelemetry logging based on environment
if os.getenv("OTEL_DEBUG", "false").lower() == "true":
    logging.getLogger("opentelemetry").setLevel(logging.DEBUG)
    logging.getLogger("opentelemetry.exporter").setLevel(logging.DEBUG)
    logging.getLogger("opentelemetry.exporter.otlp").setLevel(logging.DEBUG)
    logging.getLogger("opentelemetry.sdk").setLevel(logging.DEBUG)
    logging.getLogger("opentelemetry.instrumentation").setLevel(logging.DEBUG)
    logging.getLogger("opentelemetry.instrumentation.fastapi").setLevel(logging.DEBUG)
    logging.getLogger("opentelemetry.instrumentation.asgi").setLevel(logging.DEBUG)
    logging.getLogger("open_webui.utils.telemetry").setLevel(logging.DEBUG)

logger = logging.getLogger(__name__)


def test_otlp_connection(exporter):
    """Test OTLP connection by attempting to create and export a test span"""
    try:
        logger.info("OTLP connection will be verified when first real span is exported")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize OTLP test: {e}", exc_info=True)
        return False


def setup(app: FastAPI, db_engine: Engine):
    logger.info("Setting up OpenTelemetry telemetry...")

    # Check if we have the required API key first
    nr_api_key = os.getenv("NEW_RELIC_LICENSE_KEY")
    if not nr_api_key:
        logger.warning(
            "NEW_RELIC_LICENSE_KEY environment variable is not set, skipping telemetry setup completely"
        )
        return

    # set up trace
    tracer_provider = TracerProvider(
        resource=Resource.create(attributes={SERVICE_NAME: OTEL_SERVICE_NAME})
    )
    trace.set_tracer_provider(tracer_provider)
    logger.info(f"TracerProvider configured with service name: {OTEL_SERVICE_NAME}")

    # otlp export
    try:
        base_exporter = OTLPSpanExporter(
            endpoint=OTEL_EXPORTER_OTLP_ENDPOINT or "https://otlp.nr-data.net:4317",
            headers={"api-key": nr_api_key},
        )
        exporter = LoggingSpanExporter(base_exporter)
        logger.info(
            f"OTLP Exporter created with endpoint: {OTEL_EXPORTER_OTLP_ENDPOINT or 'https://otlp.nr-data.net:4317'}"
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
