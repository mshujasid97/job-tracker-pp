"""Authentication API endpoints and OAuth2 JWT implementation.

This module handles user registration, login, and JWT token validation. It implements
the OAuth2 with Bearer token pattern:

1. Register: Create account with email/password
2. Login: Authenticate with email/password, receive JWT token
3. Protected routes: Include JWT token in Authorization header for subsequent requests
4. Token validation: The get_current_user dependency extracts and validates JWT token

JWT Flow:
- User logs in → creates JWT with user_id in payload → returns to frontend
- Frontend includes JWT in Authorization header for protected endpoints
- Backend validates JWT signature and expiry before allowing access
- Tokens expire after ACCESS_TOKEN_EXPIRE_MINUTES (configured in settings)
"""

import re
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel, EmailStr, field_validator
from ..database import get_db
from ..models.user import User
from ..core.security import (
    verify_password, get_password_hash, create_access_token, decode_access_token
)
from ..core.rate_limiter import check_rate_limit
from ..core.logging import logger
from ..config import settings

router = APIRouter()
# OAuth2 scheme: tells FastAPI to expect JWT tokens in Authorization header
# tokenUrl specifies the endpoint where clients get tokens (the /login endpoint)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


# Pydantic schemas for request/response validation
class UserCreate(BaseModel):
    """Schema for user registration request."""
    email: EmailStr
    password: str
    full_name: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password meets security requirements.

        Requirements:
        - Minimum 8 characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one digit
        """
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserResponse(BaseModel):
    """Schema for returning user data in API responses (excludes password)."""
    id: UUID
    email: str
    full_name: str
    role: str

    class Config:
        from_attributes = True  # Allows ORM model conversion to schema


class Token(BaseModel):
    """Schema for token response after successful login."""
    access_token: str
    token_type: str


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Dependency for protecting routes that require authentication.

    Extracts JWT token from Authorization header, validates it, and returns the current user.
    Used with Depends() in protected route handlers.

    Args:
        token: JWT token extracted from Authorization header by oauth2_scheme
        db: Database session injected by dependency injection

    Returns:
        User object for the authenticated user

    Raises:
        HTTPException(401): If token is invalid, expired, or user not found

    Example:
        @router.get("/me", response_model=UserResponse)
        async def get_profile(current_user: User = Depends(get_current_user)):
            # current_user is now available and validated
            return current_user
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode and validate JWT token signature and expiry
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    # Extract user_id from token payload (stored as "sub" claim)
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Verify user still exists in database
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user


# API Endpoints
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> UserResponse:
    """Register a new user account.

    Creates a new user with hashed password (never stored in plaintext).
    Email must be unique in the system. Rate limited to prevent spam.

    Args:
        request: FastAPI request object (for rate limiting)
        user_data: User registration data (email, password, full_name)
        db: Database session

    Returns:
        UserResponse: Created user (without password)

    Raises:
        HTTPException(400): If email already registered
        HTTPException(429): If rate limit exceeded
    """
    # Rate limiting - prevent spam account creation
    check_rate_limit(
        request,
        max_requests=settings.RATE_LIMIT_REGISTER_MAX,
        window_seconds=settings.RATE_LIMIT_REGISTER_WINDOW,
        key_prefix="register"
    )

    # Email uniqueness check - prevent duplicate accounts
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user with hashed password (bcrypt hashing happens in get_password_hash)
    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),  # Password is hashed and salted
        full_name=user_data.full_name
    )

    # Persist to database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # Reload to get generated fields (id, created_at, etc.)

    logger.info(f"New user registered: {user_data.email}")
    return new_user


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Token:
    """Authenticate user and return JWT access token.

    Validates email and password, then creates a JWT token that the client stores
    and includes in subsequent requests to authenticate. Rate limited to prevent brute-force.

    Args:
        request: FastAPI request object (for rate limiting)
        form_data: OAuth2 form data (username field maps to email, password field)
        db: Database session

    Returns:
        Token: JWT access token and token type

    Raises:
        HTTPException(401): If email/password incorrect or user not found
        HTTPException(429): If rate limit exceeded
    """
    # Rate limiting - prevent brute-force attacks
    check_rate_limit(
        request,
        max_requests=settings.RATE_LIMIT_LOGIN_MAX,
        window_seconds=settings.RATE_LIMIT_LOGIN_WINDOW,
        key_prefix="login"
    )

    # Find user by email (OAuth2 convention uses "username" field, but we treat as email)
    user = db.query(User).filter(User.email == form_data.username).first()

    # Verify password using bcrypt comparison (timing-safe)
    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Failed login attempt for: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create JWT token with expiry time
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},  # Payload: store user_id as "sub" claim
        expires_delta=access_token_expires
    )

    logger.info(f"User logged in: {user.email}")
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """Get the currently authenticated user's information.

    Protected endpoint - requires valid JWT token in Authorization header.

    Args:
        current_user: Authenticated user injected by get_current_user dependency

    Returns:
        UserResponse: Current user's profile data
    """
    return current_user