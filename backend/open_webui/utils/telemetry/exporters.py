import logging
import threading

from opentelemetry.sdk.trace import ReadableSpan
from opentelemetry.sdk.trace.export import BatchSpanProcessor, SpanExportResult

logger = logging.getLogger(__name__)


class LoggingSpanExporter:
    """Wrapper exporter that adds logging to span export operations"""

    def __init__(self, wrapped_exporter):
        self.wrapped_exporter = wrapped_exporter

    def export(self, spans):
        logger.debug(f"Exporting {len(spans)} spans")
        try:
            result = self.wrapped_exporter.export(spans)
            if result == SpanExportResult.FAILURE:
                logger.error("Failed to export spans")
            elif result not in [SpanExportResult.SUCCESS, SpanExportResult.FAILURE]:
                logger.warning(f"Unexpected export result: {result}")
            return result
        except Exception as e:
            logger.error(f"Exception during span export: {e}", exc_info=True)
            raise

    def shutdown(self):
        return self.wrapped_exporter.shutdown()

    def force_flush(self, timeout_millis: int = 30000):
        if hasattr(self.wrapped_exporter, "force_flush"):
            return self.wrapped_exporter.force_flush(timeout_millis)
        return True


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
        self._worker_lock = threading.Lock()

    def on_end(self, span: ReadableSpan) -> None:
        with self._worker_lock:
            if self.worker_thread is None or not self.worker_thread.is_alive():
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
        # Just call the parent worker method - logging is handled by LoggingSpanExporter
        super().worker()

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
