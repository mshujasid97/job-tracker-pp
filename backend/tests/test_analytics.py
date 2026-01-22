"""Tests for analytics endpoints (/api/analytics/).

Tests cover:
- Summary statistics (total, status breakdown, success rate)
- Timeline data for charting
"""

import pytest
from datetime import date, timedelta
from conftest import create_application
from app.models.application import ApplicationStatus


class TestAnalyticsSummary:
    """Tests for GET /api/analytics/summary endpoint."""

    def test_analytics_summary_empty(self, client, auth_headers):
        """Return zeroed summary when user has no applications."""
        response = client.get("/api/analytics/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total_applications"] == 0
        assert data["status_breakdown"] == {}
        assert data["applications_this_week"] == 0
        assert data["applications_this_month"] == 0
        assert data["success_rate"] == 0.0

    def test_analytics_summary_with_data(self, client, db, test_user, auth_headers):
        """Return correct summary statistics."""
        # Create applications with different statuses
        create_application(db, test_user, "Company A", ApplicationStatus.APPLIED)
        create_application(db, test_user, "Company B", ApplicationStatus.APPLIED)
        create_application(db, test_user, "Company C", ApplicationStatus.INTERVIEW)
        create_application(db, test_user, "Company D", ApplicationStatus.OFFER)
        create_application(db, test_user, "Company E", ApplicationStatus.REJECTED)

        response = client.get("/api/analytics/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()

        assert data["total_applications"] == 5
        assert data["status_breakdown"]["applied"] == 2
        assert data["status_breakdown"]["interview"] == 1
        assert data["status_breakdown"]["offer"] == 1
        assert data["status_breakdown"]["rejected"] == 1
        # Success rate: 1 offer out of 5 = 20%
        assert data["success_rate"] == 20.0

    def test_analytics_summary_success_rate_with_accepted(
        self, client, db, test_user, auth_headers
    ):
        """Success rate includes both OFFER and ACCEPTED status."""
        create_application(db, test_user, "Company A", ApplicationStatus.APPLIED)
        create_application(db, test_user, "Company B", ApplicationStatus.OFFER)
        create_application(db, test_user, "Company C", ApplicationStatus.ACCEPTED)
        create_application(db, test_user, "Company D", ApplicationStatus.REJECTED)

        response = client.get("/api/analytics/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()

        # Success rate: 2 (offer + accepted) out of 4 = 50%
        assert data["success_rate"] == 50.0

    def test_analytics_summary_excludes_archived(
        self, client, db, test_user, auth_headers
    ):
        """Archived applications should not be counted."""
        app1 = create_application(db, test_user, "Active Company", ApplicationStatus.APPLIED)
        app2 = create_application(db, test_user, "Archived Company", ApplicationStatus.OFFER)
        app2.is_archived = True
        db.commit()

        response = client.get("/api/analytics/summary", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()

        assert data["total_applications"] == 1
        # The archived offer should not count toward success rate
        assert data["success_rate"] == 0.0

    def test_analytics_summary_unauthenticated(self, client):
        """Reject request without authentication."""
        response = client.get("/api/analytics/summary")
        assert response.status_code == 401


class TestAnalyticsTimeline:
    """Tests for GET /api/analytics/timeline endpoint."""

    def test_analytics_timeline_empty(self, client, auth_headers):
        """Return empty list when user has no applications."""
        response = client.get("/api/analytics/timeline", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_analytics_timeline_with_data(self, client, db, test_user, auth_headers):
        """Return timeline data grouped by date."""
        # Create 3 applications today
        create_application(db, test_user, "Company A")
        create_application(db, test_user, "Company B")
        create_application(db, test_user, "Company C")

        response = client.get("/api/analytics/timeline", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()

        assert len(data) == 1
        assert data[0]["date"] == str(date.today())
        assert data[0]["count"] == 3

    def test_analytics_timeline_custom_days(self, client, db, test_user, auth_headers):
        """Timeline respects the days parameter."""
        create_application(db, test_user, "Company A")

        response = client.get(
            "/api/analytics/timeline?days=7",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1  # At least today's data

    def test_analytics_timeline_excludes_archived(
        self, client, db, test_user, auth_headers
    ):
        """Archived applications should not appear in timeline."""
        app1 = create_application(db, test_user, "Active Company")
        app2 = create_application(db, test_user, "Archived Company")
        app2.is_archived = True
        db.commit()

        response = client.get("/api/analytics/timeline", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()

        # Only 1 active application today
        assert len(data) == 1
        assert data[0]["count"] == 1

    def test_analytics_timeline_unauthenticated(self, client):
        """Reject request without authentication."""
        response = client.get("/api/analytics/timeline")
        assert response.status_code == 401


class TestAnalyticsMultiTenancy:
    """Tests for analytics multi-tenancy (user isolation)."""

    def test_analytics_only_counts_own_applications(
        self, client, db, test_user, test_user_2, auth_headers, auth_headers_user_2
    ):
        """Analytics should only count the current user's applications."""
        # User 1 has 3 applications
        create_application(db, test_user, "User1 A")
        create_application(db, test_user, "User1 B")
        create_application(db, test_user, "User1 C")

        # User 2 has 1 application
        create_application(db, test_user_2, "User2 A")

        # User 1's summary
        response = client.get("/api/analytics/summary", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["total_applications"] == 3

        # User 2's summary
        response = client.get("/api/analytics/summary", headers=auth_headers_user_2)
        assert response.status_code == 200
        assert response.json()["total_applications"] == 1
