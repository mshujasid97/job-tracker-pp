"""Application configuration using environment variables.

This module defines all configurable settings for the application using Pydantic BaseSettings.
Settings are loaded from environment variables or .env file. In production, set these
variables in the deployment environment (Docker, cloud platform, etc.).

Key configuration areas:
- App metadata (name, debug mode)
- Database connection string
- JWT security parameters
- CORS allowed origins for frontend communication
- Optional email/SMTP settings for notifications
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""

    # Application metadata
    APP_NAME: str = "Job Application Tracker by Shuja"
    DEBUG: bool = True  # Set to False in production

    # Database connection string - format: postgresql://user:password@host:port/dbname
    # Default assumes PostgreSQL running locally with user 'jobtracker', password 'password'
    DATABASE_URL: str = "postgresql://jobtracker:password@localhost:5432/job_tracker"

    # JWT security settings
    SECRET_KEY: str = "your-secret-key-change-this-in-production"  # CRITICAL: Change in production!
    ALGORITHM: str = "HS256"  # Algorithm for JWT signing
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # JWT expiry time in minutes

    # CORS origins - URLs that can make requests to this API
    # Frontend URLs that should be allowed to call this backend
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]

    # Redis settings for rate limiting
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"

    # Rate limiting settings
    RATE_LIMIT_LOGIN_MAX: int = 5  # Max login attempts per window
    RATE_LIMIT_LOGIN_WINDOW: int = 60  # Window in seconds (1 minute)
    RATE_LIMIT_REGISTER_MAX: int = 3  # Max registration attempts per window
    RATE_LIMIT_REGISTER_WINDOW: int = 300  # Window in seconds (5 minutes)

    # Email/SMTP settings (optional, for future notification features)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None

    class Config:
        env_file = ".env"  # Load from .env file if it exists
        case_sensitive = True  # Environment variable names are case-sensitive


# Global settings instance used throughout the application
settings = Settings()