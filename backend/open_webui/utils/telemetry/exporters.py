import logging
import threading

from opentelemetry.sdk.trace import ReadableSpan
from opentelemetry.sdk.trace.export import BatchSpanProcessor

logger = logging.getLogger(__name__)


class LazyBatchSpanProcessor(BatchSpanProcessor):
    def __init__(self, *args, **kwargs):
        logger.debug("Initializing LazyBatchSpanProcessor")
        super().__init__(*args, **kwargs)
        self.done = True
        with self.condition:
            self.condition.notify_all()
        self.worker_thread.join()
        self.done = False
        self.worker_thread = None

    def on_end(self, span: ReadableSpan) -> None:
        if self.worker_thread is None:
            logger.debug("Starting worker thread for span processing")
            self.worker_thread = threading.Thread(
                name=self.__class__.__name__, target=self.worker, daemon=True
            )
            self.worker_thread.start()

        try:
            super().on_end(span)
        except Exception as e:
            logger.error(f"Error processing span {span.name}: {e}", exc_info=True)

    def worker(self):
        """Override worker to add export logging"""
        logger.debug("Starting span export worker thread")

        # Use parent class worker but with logging wrapper
        from opentelemetry.sdk.trace.export import SpanExportResult

        # Wrap the span_exporter.export method to add logging
        original_export = self.span_exporter.export

        def logged_export(spans):
            logger.debug(f"Exporting {len(spans)} spans")

            try:
                result = original_export(spans)

                if result == SpanExportResult.FAILURE:
                    logger.error("Failed to export spans")
                elif result not in [SpanExportResult.SUCCESS, SpanExportResult.FAILURE]:
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
        logger.debug("Shutting down LazyBatchSpanProcessor")
        self.done = True
        with self.condition:
            self.condition.notify_all()
        if self.worker_thread:
            self.worker_thread.join()
        try:
            self.span_exporter.shutdown()
        except Exception as e:
            logger.error(f"Error during span exporter shutdown: {e}", exc_info=True)
