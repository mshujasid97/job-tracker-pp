"""Tests for applications CRUD endpoints (/api/applications/).

Tests cover:
- Creating applications
- Listing applications with filtering and search
- Getting single application by ID
- Updating applications
- Deleting applications
- Archiving/unarchiving applications
- Multi-tenancy security (users cannot access other users' data)
"""

import pytest
from datetime import date
from conftest import create_application
from app.models.application import ApplicationStatus


class TestCreateApplication:
    """Tests for POST /api/applications/ endpoint."""

    def test_create_application(self, client, auth_headers):
        """Successfully create a new application."""
        response = client.post(
            "/api/applications/",
            json={
                "company_name": "Google",
                "job_title": "Software Engineer",
                "status": "applied",
                "date_applied": str(date.today()),
                "job_url": "https://careers.google.com/job123",
                "notes": "Applied through referral"
            },
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["company_name"] == "Google"
        assert data["job_title"] == "Software Engineer"
        assert data["status"] == "applied"
        assert data["is_archived"] == False
        assert "id" in data

    def test_create_application_minimal(self, client, auth_headers):
        """Create application with only required fields."""
        response = client.post(
            "/api/applications/",
            json={
                "company_name": "Microsoft",
                "job_title": "Developer",
                "date_applied": str(date.today())
            },
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["company_name"] == "Microsoft"
        assert data["status"] == "applied"  # Default status
        assert data["job_url"] is None
        assert data["notes"] is None

    def test_create_application_unauthenticated(self, client):
        """Reject application creation without authentication."""
        response = client.post(
            "/api/applications/",
            json={
                "company_name": "Test",
                "job_title": "Test",
                "date_applied": str(date.today())
            }
        )
        assert response.status_code == 401


class TestGetApplications:
    """Tests for GET /api/applications/ endpoint."""

    def test_get_applications_empty(self, client, auth_headers):
        """Return empty list when user has no applications."""
        response = client.get("/api/applications/", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_applications_list(self, client, db, test_user, auth_headers):
        """Return list of user's applications."""
        create_application(db, test_user, "Company A")
        create_application(db, test_user, "Company B")
        create_application(db, test_user, "Company C")

        response = client.get("/api/applications/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_get_applications_filter_by_status(self, client, db, test_user, auth_headers):
        """Filter applications by status."""
        create_application(db, test_user, "Company A", ApplicationStatus.APPLIED)
        create_application(db, test_user, "Company B", ApplicationStatus.INTERVIEW)
        create_application(db, test_user, "Company C", ApplicationStatus.INTERVIEW)

        response = client.get(
            "/api/applications/?status=interview",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(app["status"] == "interview" for app in data)

    def test_get_applications_search(self, client, db, test_user, auth_headers):
        """Search applications by company name."""
        create_application(db, test_user, "Google")
        create_application(db, test_user, "Microsoft")
        create_application(db, test_user, "Alphabet")

        response = client.get(
            "/api/applications/?search=goo",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["company_name"] == "Google"

    def test_get_applications_excludes_archived(self, client, db, test_user, auth_headers):
        """By default, archived applications are excluded."""
        app1 = create_application(db, test_user, "Active Company")
        app2 = create_application(db, test_user, "Archived Company")
        app2.is_archived = True
        db.commit()

        response = client.get("/api/applications/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["company_name"] == "Active Company"

    def test_get_applications_archived_only(self, client, db, test_user, auth_headers):
        """Get only archived applications."""
        app1 = create_application(db, test_user, "Active Company")
        app2 = create_application(db, test_user, "Archived Company")
        app2.is_archived = True
        db.commit()

        response = client.get(
            "/api/applications/?is_archived=true",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["company_name"] == "Archived Company"


class TestGetSingleApplication:
    """Tests for GET /api/applications/{id} endpoint."""

    def test_get_single_application(self, client, test_application, auth_headers):
        """Get application by ID."""
        response = client.get(
            f"/api/applications/{test_application.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["company_name"] == "Test Company"
        assert data["id"] == str(test_application.id)

    def test_get_application_not_found(self, client, auth_headers):
        """Return 404 for non-existent application."""
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        response = client.get(
            f"/api/applications/{fake_uuid}",
            headers=auth_headers
        )
        assert response.status_code == 404


class TestUpdateApplication:
    """Tests for PUT /api/applications/{id} endpoint."""

    def test_update_application(self, client, test_application, auth_headers):
        """Update application fields."""
        response = client.put(
            f"/api/applications/{test_application.id}",
            json={
                "status": "interview",
                "notes": "Phone screen scheduled"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "interview"
        assert data["notes"] == "Phone screen scheduled"
        # Unchanged fields should remain
        assert data["company_name"] == "Test Company"

    def test_update_application_not_found(self, client, auth_headers):
        """Return 404 when updating non-existent application."""
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        response = client.put(
            f"/api/applications/{fake_uuid}",
            json={"status": "interview"},
            headers=auth_headers
        )
        assert response.status_code == 404


class TestDeleteApplication:
    """Tests for DELETE /api/applications/{id} endpoint."""

    def test_delete_application(self, client, test_application, auth_headers):
        """Successfully delete an application."""
        response = client.delete(
            f"/api/applications/{test_application.id}",
            headers=auth_headers
        )
        assert response.status_code == 204

        # Verify it's deleted
        get_response = client.get(
            f"/api/applications/{test_application.id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404

    def test_delete_application_not_found(self, client, auth_headers):
        """Return 404 when deleting non-existent application."""
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        response = client.delete(
            f"/api/applications/{fake_uuid}",
            headers=auth_headers
        )
        assert response.status_code == 404


class TestArchiveToggle:
    """Tests for PATCH /api/applications/{id}/archive endpoint."""

    def test_archive_application(self, client, test_application, auth_headers):
        """Archive an active application."""
        assert test_application.is_archived == False

        response = client.patch(
            f"/api/applications/{test_application.id}/archive",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_archived"] == True

    def test_unarchive_application(self, client, db, test_application, auth_headers):
        """Unarchive an archived application."""
        test_application.is_archived = True
        db.commit()

        response = client.patch(
            f"/api/applications/{test_application.id}/archive",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_archived"] == False


class TestMultiTenancy:
    """Tests for multi-tenancy security (user isolation)."""

    def test_cannot_access_other_users_application(
        self, client, db, test_user, test_user_2, auth_headers, auth_headers_user_2
    ):
        """Users cannot access other users' applications."""
        # Create application for user 1
        app = create_application(db, test_user, "User 1 Company")

        # User 2 tries to access it
        response = client.get(
            f"/api/applications/{app.id}",
            headers=auth_headers_user_2
        )
        assert response.status_code == 404

    def test_cannot_update_other_users_application(
        self, client, db, test_user, test_user_2, auth_headers, auth_headers_user_2
    ):
        """Users cannot update other users' applications."""
        app = create_application(db, test_user, "User 1 Company")

        response = client.put(
            f"/api/applications/{app.id}",
            json={"status": "rejected"},
            headers=auth_headers_user_2
        )
        assert response.status_code == 404

    def test_cannot_delete_other_users_application(
        self, client, db, test_user, test_user_2, auth_headers, auth_headers_user_2
    ):
        """Users cannot delete other users' applications."""
        app = create_application(db, test_user, "User 1 Company")

        response = client.delete(
            f"/api/applications/{app.id}",
            headers=auth_headers_user_2
        )
        assert response.status_code == 404

    def test_applications_list_only_shows_own(
        self, client, db, test_user, test_user_2, auth_headers, auth_headers_user_2
    ):
        """Users only see their own applications in list."""
        create_application(db, test_user, "User 1 Company A")
        create_application(db, test_user, "User 1 Company B")
        create_application(db, test_user_2, "User 2 Company")

        # User 1 should see only their 2 applications
        response = client.get("/api/applications/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all("User 1" in app["company_name"] for app in data)

        # User 2 should see only their 1 application
        response = client.get("/api/applications/", headers=auth_headers_user_2)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["company_name"] == "User 2 Company"
