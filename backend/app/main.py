"""Main FastAPI application factory and configuration.

This module initializes the FastAPI app, sets up middleware (CORS for frontend communication),
creates database tables, and registers all API routers (auth, applications, analytics).

The app follows a layered architecture:
- API layer (api/): Route handlers with request/response schemas
- Database layer (models/): SQLAlchemy ORM entities
- Core utilities (core/): JWT and password hashing functions
- Configuration: Environment-based settings
"""

import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from .config import settings
from .database import engine, Base
from .api import auth, applications, analytics
from .core.logging import logger


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all incoming requests and their response times."""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time

        # Log request details
        logger.info(
            f"{request.method} {request.url.path} - {response.status_code} - {duration:.3f}s"
        )

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses to protect against common attacks."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Prevent XSS attacks by controlling resource loading
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking by disallowing iframe embedding
        response.headers["X-Frame-Options"] = "DENY"

        # Enable browser XSS filter
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Control referrer information leakage
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Prevent MIME type sniffing
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"

        # Force HTTPS in production (uncomment when using HTTPS)
        # response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


# Create database tables on startup (idempotent - only creates if not exists)
# In production, use Alembic migrations instead
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)

# Request logging middleware - logs all requests with timing
app.add_middleware(RequestLoggingMiddleware)

# Security headers middleware - adds protection headers to all responses
app.add_middleware(SecurityHeadersMiddleware)

# CORS middleware enables cross-origin requests from frontend (React app on localhost:5173)
# This allows the frontend to make API calls to this backend from a different origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # Whitelist frontend URLs from config
    allow_credentials=True,  # Allow sending cookies/auth headers
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers (including Authorization header for JWT tokens)
)

# Register all API route groups with their URL prefixes
# Each router handles a specific domain: authentication, job applications, analytics
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])


@app.get("/")
async def root():
    return {
        "message": "Job Application Tracker by Shuja - API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
