"""Rate limiting utility using Redis for distributed rate limiting.

Implements a sliding window rate limiter to protect endpoints from abuse.
Uses Redis for storage, allowing rate limits to work across multiple app instances.
"""

import redis
from fastapi import Request, HTTPException, status
from typing import Optional
from ..config import settings


class RateLimiter:
    """Redis-based rate limiter using sliding window algorithm."""

    def __init__(self):
        """Initialize Redis connection."""
        self._redis: Optional[redis.Redis] = None

    @property
    def redis(self) -> Optional[redis.Redis]:
        """Lazy initialization of Redis connection."""
        if self._redis is None and settings.REDIS_URL:
            try:
                self._redis = redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True
                )
                # Test connection
                self._redis.ping()
            except redis.ConnectionError:
                self._redis = None
        return self._redis

    def is_rate_limited(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> bool:
        """Check if a key has exceeded the rate limit.

        Args:
            key: Unique identifier (e.g., IP address or user ID)
            max_requests: Maximum allowed requests in the window
            window_seconds: Time window in seconds

        Returns:
            True if rate limited, False otherwise
        """
        if self.redis is None:
            # If Redis is unavailable, allow the request (fail open)
            return False

        try:
            current = self.redis.incr(key)
            if current == 1:
                # First request, set expiry
                self.redis.expire(key, window_seconds)
            return current > max_requests
        except redis.RedisError:
            # On Redis error, fail open
            return False

    def get_remaining(self, key: str, max_requests: int) -> int:
        """Get remaining requests for a key.

        Args:
            key: Unique identifier
            max_requests: Maximum allowed requests

        Returns:
            Number of remaining requests
        """
        if self.redis is None:
            return max_requests

        try:
            current = self.redis.get(key)
            if current is None:
                return max_requests
            return max(0, max_requests - int(current))
        except redis.RedisError:
            return max_requests


# Global rate limiter instance
rate_limiter = RateLimiter()


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies."""
    # Check for forwarded header (behind proxy/load balancer)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    # Fall back to direct client IP
    return request.client.host if request.client else "unknown"


def check_rate_limit(
    request: Request,
    max_requests: int,
    window_seconds: int,
    key_prefix: str
) -> None:
    """Check rate limit and raise HTTPException if exceeded.

    Args:
        request: FastAPI request object
        max_requests: Maximum allowed requests in the window
        window_seconds: Time window in seconds
        key_prefix: Prefix for the Redis key (e.g., "login", "register")

    Raises:
        HTTPException: 429 Too Many Requests if rate limited
    """
    client_ip = get_client_ip(request)
    key = f"rate_limit:{key_prefix}:{client_ip}"

    if rate_limiter.is_rate_limited(key, max_requests, window_seconds):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
            headers={"Retry-After": str(window_seconds)}
        )
