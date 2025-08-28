import logging
import threading

from opentelemetry.sdk.trace import ReadableSpan
from opentelemetry.sdk.trace.export import BatchSpanProcessor

logger = logging.getLogger(__name__)


class LazyBatchSpanProcessor(BatchSpanProcessor):
    def __init__(self, *args, **kwargs):
        logger.info("Initializing LazyBatchSpanProcessor")
        super().__init__(*args, **kwargs)
        self.done = True
        with self.condition:
            self.condition.notify_all()
        self.worker_thread.join()
        self.done = False
        self.worker_thread = None
        logger.info("LazyBatchSpanProcessor initialized successfully")

    def on_end(self, span: ReadableSpan) -> None:
        logger.debug(
            f"Processing span: {span.name} (trace_id: {span.get_span_context().trace_id:032x})"
        )
        if self.worker_thread is None:
            logger.info("Starting worker thread for span processing")
            self.worker_thread = threading.Thread(
                name=self.__class__.__name__, target=self.worker, daemon=True
            )
            self.worker_thread.start()

        try:
            super().on_end(span)
            logger.debug(f"Span {span.name} queued for export successfully")
        except Exception as e:
            logger.error(f"Error processing span {span.name}: {e}", exc_info=True)

    def worker(self):
        """Override worker to add export logging"""
        logger.info("Starting span export worker thread")

        # Use parent class worker but with logging wrapper
        from opentelemetry.sdk.trace.export import SpanExportResult

        # Wrap the span_exporter.export method to add logging
        original_export = self.span_exporter.export

        def logged_export(spans):
            logger.info(f"Attempting to export {len(spans)} spans to New Relic")
            for span in spans:
                logger.debug(
                    f"Exporting span: {span.name} (trace_id: {span.get_span_context().trace_id:032x})"
                )

            try:
                result = original_export(spans)
                logger.info(f"Export result: {result}")

                if result == SpanExportResult.SUCCESS:
                    logger.info("Spans exported successfully to New Relic")
                elif result == SpanExportResult.FAILURE:
                    logger.error("Failed to export spans to New Relic")
                else:
                    logger.warning(f"Unexpected export result: {result}")

                return result
            except Exception as e:
                logger.error(f"Exception during span export: {e}", exc_info=True)
                raise

        # Temporarily replace the export method
        self.span_exporter.export = logged_export

        try:
            # Call the parent worker method
            super().worker()
        finally:
            # Restore original export method
            self.span_exporter.export = original_export

    def shutdown(self) -> None:
        logger.info("Shutting down LazyBatchSpanProcessor")
        self.done = True
        with self.condition:
            self.condition.notify_all()
        if self.worker_thread:
            self.worker_thread.join()
        try:
            self.span_exporter.shutdown()
            logger.info("Span exporter shutdown completed")
        except Exception as e:
            logger.error(f"Error during span exporter shutdown: {e}", exc_info=True)
