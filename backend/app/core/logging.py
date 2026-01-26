"""Logging configuration for the application.

Sets up structured logging with configurable levels and formats.
"""

import logging
import sys
from ..config import settings


def setup_logging() -> logging.Logger:
    """Configure and return the application logger."""
    logger = logging.getLogger("job_tracker")

    # Set level based on debug mode
    level = logging.DEBUG if settings.DEBUG else logging.INFO
    logger.setLevel(level)

    # Avoid duplicate handlers
    if logger.handlers:
        return logger

    # Console handler with formatting
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)

    # Format: timestamp - level - message
    formatter = logging.Formatter(
        "%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger


# Global logger instance
logger = setup_logging()
