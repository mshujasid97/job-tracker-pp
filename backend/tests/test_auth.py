"""Tests for authentication endpoints (/api/auth/).

Tests cover:
- User registration (success and duplicate email rejection)
- User login (success and failure cases)
- Protected endpoint access (with and without valid token)
"""

import pytest


class TestRegister:
    """Tests for POST /api/auth/register endpoint."""

    def test_register_success(self, client):
        """Successfully register a new user."""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepassword123",
                "full_name": "New User"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["full_name"] == "New User"
        assert data["role"] == "user"
        assert "id" in data
        # Password should not be returned
        assert "password" not in data
        assert "hashed_password" not in data

    def test_register_duplicate_email(self, client, test_user):
        """Reject registration with existing email."""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",  # Same as test_user
                "password": "anotherpassword",
                "full_name": "Another User"
            }
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_register_invalid_email(self, client):
        """Reject registration with invalid email format."""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "not-an-email",
                "password": "password123",
                "full_name": "Test User"
            }
        )
        assert response.status_code == 422  # Validation error


class TestLogin:
    """Tests for POST /api/auth/login endpoint."""

    def test_login_success(self, client, test_user):
        """Successfully login and receive JWT token."""
        response = client.post(
            "/api/auth/login",
            data={"username": "test@example.com", "password": "testpassword123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, test_user):
        """Reject login with incorrect password."""
        response = client.post(
            "/api/auth/login",
            data={"username": "test@example.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, client):
        """Reject login for non-existent user."""
        response = client.post(
            "/api/auth/login",
            data={"username": "nobody@example.com", "password": "password123"}
        )
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()


class TestGetMe:
    """Tests for GET /api/auth/me endpoint."""

    def test_get_me_authenticated(self, client, test_user, auth_headers):
        """Get current user info with valid token."""
        response = client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["full_name"] == "Test User"
        assert "id" in data

    def test_get_me_unauthenticated(self, client):
        """Reject request without authentication token."""
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_get_me_invalid_token(self, client):
        """Reject request with invalid token."""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid-token"}
        )
        assert response.status_code == 401
