"""User model for authentication and application ownership.

This module defines the User ORM entity which stores authentication credentials
and user metadata. Each user can own multiple job applications through a
one-to-many relationship.

Key features:
- Email uniqueness: Ensures each account has a unique email (indexed for fast lookups)
- Password security: Passwords are hashed with bcrypt (never stored in plaintext)
- Role-based access: Support for user and admin roles (for future admin features)
- Cascading deletes: Deleting a user automatically deletes their applications
- Timestamps: Track when user was created and last updated
"""

import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base


class UserRole(str, enum.Enum):
    """Enumeration of user roles in the system."""
    USER = "user"  # Regular user with access to their own data
    ADMIN = "admin"  # Administrator with elevated privileges (future feature)


class User(Base):
    """User entity representing a registered account.

    Attributes:
        id: Primary key (UUID) - unique identifier for the user
        email: User's email address (unique, indexed)
        hashed_password: Bcrypt-hashed password (never stored in plaintext)
        full_name: User's display name
        role: UserRole enum (user or admin)
        created_at: Timestamp when account was created
        updated_at: Timestamp when account was last modified
        applications: Relationship to all Application records owned by this user

    Database:
        - Table name: "users"
        - Email is indexed for fast query lookups
        - Relationships use cascade delete to remove user's applications when user is deleted
    """

    __tablename__ = "users"

    # Primary key: UUID provides distributed uniqueness without database sequence dependency
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Email: Must be unique (no two accounts with same email), indexed for fast login queries
    email = Column(String, unique=True, nullable=False, index=True)

    # Hashed password: Never store plaintext passwords! Always use bcrypt hashing (via get_password_hash)
    hashed_password = Column(String, nullable=False)

    # Full name: For display purposes in the UI
    full_name = Column(String, nullable=False)

    # Role: Supports future admin functionality (admin users could manage other users, etc.)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)

    # Timestamps: Automatically managed for audit trail
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship: One-to-many with Application
    # back_populates allows bidirectional access: user.applications or app.user
    # cascade="all, delete-orphan" means deleting a user removes all their applications
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")