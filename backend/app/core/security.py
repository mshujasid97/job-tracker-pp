"""JWT token and password hashing utilities for authentication.

This module provides core security functions for:
- Password hashing and verification: Using bcrypt with automatic salting
- JWT token creation and validation: Using HS256 algorithm with expiry

Security best practices implemented:
- Passwords: Never stored in plaintext. Hashed with bcrypt (automatically salted).
           Verification is timing-safe (same time regardless of match/mismatch).
- JWT tokens: Signed with SECRET_KEY (MUST be changed in production!)
             Includes expiry time (exp claim) to limit token validity
             Tokens are stateless (no database lookup needed to validate)

Warning: Change SECRET_KEY in production! Using the default key is a security risk.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from ..config import settings

# Password context: Configures bcrypt hashing algorithm
# - schemes=["bcrypt"]: Use bcrypt algorithm for hashing (NIST recommended)
# - deprecated="auto": Supports checking legacy hashes from other algorithms
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its bcrypt hash.

    Uses timing-safe comparison to prevent timing attacks where an attacker
    could guess passwords by measuring response time.

    Args:
        plain_password: Password entered by user (plaintext)
        hashed_password: Password hash stored in database

    Returns:
        bool: True if password matches hash, False otherwise

    Example:
        if verify_password("my_password", user.hashed_password):
            # Password is correct, authenticate user
        else:
            # Password is wrong, reject login
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a plaintext password using bcrypt.

    Generates a new bcrypt hash with automatic salt generation.
    The hash includes the salt inside the hash string itself.

    CRITICAL: Never hash passwords for comparison - always use verify_password()
    for checking passwords because hashing the same password twice produces
    different results (due to random salt).

    Args:
        password: Plaintext password to hash (from user registration or password change)

    Returns:
        str: Bcrypt hash in format $2b$12$... (includes salt and algorithm info)

    Example:
        new_user = User(
            email="user@example.com",
            hashed_password=get_password_hash("my_password"),  # Hash at creation
            full_name="John Doe"
        )
    """
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token for authentication.

    Generates a signed JWT token that encodes the user_id and expiry time.
    The token is stateless (no database lookup needed during authentication).

    Token payload example:
        {
            "sub": "user-uuid-here",  # User ID (stored in "sub" claim per JWT standard)
            "exp": 1234567890        # Expiry timestamp (Unix time)
        }

    Args:
        data: Dictionary to encode in token (typically {"sub": str(user.id)})
        expires_delta: Optional timedelta for custom expiry time.
                      If not provided, uses ACCESS_TOKEN_EXPIRE_MINUTES from config.

    Returns:
        str: Signed JWT token (can be used in Authorization header: "Bearer <token>")

    Example:
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(minutes=30)
        )
        # Return to client
        return {"access_token": access_token, "token_type": "bearer"}
    """
    to_encode = data.copy()

    # Set expiry time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Default expiry from configuration
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Add expiry claim to token payload
    to_encode.update({"exp": expire})

    # Sign token with SECRET_KEY
    # WARNING: If SECRET_KEY changes, all existing tokens become invalid!
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT access token.

    Validates the JWT signature (ensures token hasn't been tampered with)
    and checks expiry (ensures token is not expired).

    Args:
        token: JWT token string to verify (from Authorization header)

    Returns:
        dict: Decoded token payload (e.g., {"sub": "user-uuid", "exp": timestamp})
        None: If token is invalid, expired, or signature verification fails

    Example:
        payload = decode_access_token(token)
        if payload is None:
            # Token is invalid/expired
            raise HTTPException(status_code=401, detail="Invalid credentials")
        user_id = payload.get("sub")
    """
    try:
        # Decode and verify token signature
        # jwt.decode automatically validates expiry (exp claim)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        # Invalid signature, expired token, or decoding error
        return None