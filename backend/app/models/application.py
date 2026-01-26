"""Job application model for tracking the lifecycle of job applications.

This module defines the Application ORM entity which stores details about each
job application submitted by a user. Applications belong to a user (many-to-one)
and track the status of the application through its lifecycle.

Key features:
- Status tracking: Applications move through states (applied→screening→interview→offer→accepted/rejected)
- Company and role info: Store what company/position was applied for
- Indexed columns: Frequently queried fields (company_name, status) are indexed for performance
- Timestamps: Track when application was submitted and last modified
- Archive feature: Soft-delete with is_archived flag (record stays in DB but hidden from views)
- Rich notes: Optional text field for storing interview notes, feedback, etc.
"""

import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Enum, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base


class ApplicationStatus(str, enum.Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER = "offer"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class Application(Base):
    """Job application entity tracking a single job application submission.

    Attributes:
        id: Primary key (UUID) - unique identifier for the application
        user_id: Foreign key to User - identifies the owner of this application
        company_name: Name of the company (indexed for search filtering)
        job_title: Title of the position applied for
        status: ApplicationStatus enum - current stage in application lifecycle (indexed)
        date_applied: Date the application was submitted
        job_url: Optional URL to the job posting
        notes: Optional text field for interview notes, feedback, etc.
        is_archived: Boolean flag for soft-delete (archived apps hidden from default views)
        created_at: Timestamp when application record was created
        updated_at: Timestamp when application record was last modified
        user: Relationship to the User who owns this application

    Database:
        - Table name: "applications"
        - user_id is a foreign key referencing users.id (one-to-many)
        - company_name and status are indexed for fast filtering/search
        - is_archived is indexed because lists are typically filtered by this

    Example lifecycle:
        1. User creates application with status=APPLIED
        2. Recruiter screens application, status changed to SCREENING
        3. Interview scheduled, status changed to INTERVIEW
        4. Offer made, status changed to OFFER
        5. User accepts, status changed to ACCEPTED (or rejects: REJECTED)
    """

    __tablename__ = "applications"

    # Primary key: UUID ensures uniqueness across all databases
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign key: Links this application to its owner
    # When a user is deleted, all their applications are cascade-deleted (see User model)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Company info: Indexed for fast filtering and searching
    company_name = Column(String, nullable=False, index=True)
    job_title = Column(String, nullable=False)

    # Status: Indexed because we frequently filter by status (e.g., "show only interviews")
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.APPLIED, nullable=False, index=True)

    # Application date: When the application was submitted
    date_applied = Column(Date, nullable=False, default=datetime.utcnow().date)

    # Optional fields: Store additional information if available
    job_url = Column(String, nullable=True)  # URL to the job posting
    notes = Column(Text, nullable=True)  # User's notes (interview feedback, rejection reason, etc.)

    # Archive flag: Soft-delete mechanism (indexed for fast filtering active vs archived)
    # When True, application is hidden from default list views but not permanently deleted
    is_archived = Column(Boolean, default=False, index=True)

    # Timestamps: Automatically managed for audit trail
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship: Many-to-one with User (multiple applications per user, one user per application)
    # back_populates allows bidirectional access: user.applications or app.user
    user = relationship("User", back_populates="applications")
