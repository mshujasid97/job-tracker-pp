"""Test configuration and fixtures for pytest.

This module sets up:
- PostgreSQL test database (uses same DB as dev, with transaction rollback for isolation)
- FastAPI TestClient with dependency overrides
- Helper fixtures for creating test users and applications
- Rate limiting disabled for tests
"""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.application import Application, ApplicationStatus
from app.core.security import get_password_hash
from app.core.rate_limiter import rate_limiter
from app.config import settings


# Use the same PostgreSQL database (tests run with transaction rollback for isolation)
engine = create_engine(settings.DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def disable_rate_limiting():
    """Disable rate limiting for all tests by mocking Redis connection."""
    with patch.object(rate_limiter, '_redis', None):
        # Also ensure the redis property returns None
        with patch.object(type(rate_limiter), 'redis', property(lambda self: None)):
            yield


@pytest.fixture(scope="function")
def db():
    """Create fresh database session for each test with transaction rollback.

    Uses a nested transaction that rolls back after each test to ensure isolation
    without needing to drop/recreate tables.
    """
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # Start a connection and begin a transaction
    connection = engine.connect()
    transaction = connection.begin()

    # Create a session bound to this connection
    session = TestingSessionLocal(bind=connection)

    yield session

    # Rollback the transaction to discard all changes
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db):
    """Create test client with database dependency override.

    Uses the same db session from the db fixture so that test data
    is visible to API calls within the same transaction.
    """
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    """Create a test user in the database."""
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test User"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_user_2(db):
    """Create a second test user for multi-tenancy tests."""
    user = User(
        email="other@example.com",
        hashed_password=get_password_hash("otherpassword123"),
        full_name="Other User"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(client, test_user):
    """Get authentication headers for the test user."""
    response = client.post(
        "/api/auth/login",
        data={"username": "test@example.com", "password": "testpassword123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_user_2(client, test_user_2):
    """Get authentication headers for the second test user."""
    response = client.post(
        "/api/auth/login",
        data={"username": "other@example.com", "password": "otherpassword123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_application(db, test_user):
    """Create a test application for the test user."""
    application = Application(
        user_id=test_user.id,
        company_name="Test Company",
        job_title="Software Engineer",
        status=ApplicationStatus.APPLIED,
        date_applied=date.today(),
        job_url="https://example.com/job",
        notes="Test notes"
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def create_application(db, user, company_name="Test Company", status=ApplicationStatus.APPLIED):
    """Helper function to create applications with custom parameters."""
    application = Application(
        user_id=user.id,
        company_name=company_name,
        job_title="Software Engineer",
        status=status,
        date_applied=date.today()
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application
