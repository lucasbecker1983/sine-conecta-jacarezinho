import logging
from logging.handlers import RotatingFileHandler

from app.core.config import get_settings


def configure_logging() -> None:
    settings = get_settings()
    settings.log_dir.mkdir(parents=True, exist_ok=True)
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")
    backend_handler = RotatingFileHandler(settings.log_dir / "backend.log", maxBytes=5_000_000, backupCount=5)
    error_handler = RotatingFileHandler(settings.log_dir / "error.log", maxBytes=5_000_000, backupCount=5)
    security_handler = RotatingFileHandler(settings.log_dir / "security.log", maxBytes=5_000_000, backupCount=5)
    stream_handler = logging.StreamHandler()

    for handler in (backend_handler, error_handler, security_handler, stream_handler):
        handler.setFormatter(formatter)

    error_handler.setLevel(logging.ERROR)
    security_handler.setLevel(logging.INFO)
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.handlers.clear()
    root.addHandler(backend_handler)
    root.addHandler(error_handler)
    root.addHandler(stream_handler)

    security_logger = logging.getLogger("sine.security")
    security_logger.setLevel(logging.INFO)
    security_logger.addHandler(security_handler)
    security_logger.propagate = True
