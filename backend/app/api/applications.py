"""Job applications CRUD endpoints with filtering, searching, and archiving.

This module provides endpoints to create, read, update, and delete job applications.
Each application belongs to a user (established via user_id foreign key).

Key features:
- Multi-tenant: Applications are always filtered by current user (user_id)
  This ensures users can only see/edit their own applications
- Status tracking: Applications move through lifecycle states (applied→screening→interview→offer→accepted/rejected)
- Search and filter: Filter by status, search company name, hide archived applications
- Pagination: Support for skip/limit parameters for large datasets
- Archive feature: Soft-delete applications without removing them from database
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from datetime import datetime
from uuid import UUID
from ..database import get_db
from ..models.user import User
from ..models.application import Application, ApplicationStatus
from ..api.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()


class ApplicationCreate(BaseModel):
    """Schema for creating a new job application."""
    company_name: str
    job_title: str
    status: ApplicationStatus = ApplicationStatus.APPLIED  # Default: just applied
    date_applied: date
    job_url: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[date] = None  # Reminder date for follow-up
    last_contact_date: Optional[date] = None  # Last interaction with recruiter


class ApplicationUpdate(BaseModel):
    """Schema for updating an existing job application (all fields optional)."""
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    date_applied: Optional[date] = None
    job_url: Optional[str] = None
    notes: Optional[str] = None
    follow_up_date: Optional[date] = None
    last_contact_date: Optional[date] = None


class ApplicationResponse(BaseModel):
    """Schema for returning application data in API responses."""
    id: UUID
    company_name: str
    job_title: str
    status: ApplicationStatus
    date_applied: date
    job_url: Optional[str]
    notes: Optional[str]
    follow_up_date: Optional[date]
    last_contact_date: Optional[date]
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Convert SQLAlchemy ORM model to schema


# API Endpoints
@router.get("/", response_model=List[ApplicationResponse])
async def get_applications(
    status: Optional[ApplicationStatus] = None,
    search: Optional[str] = None,
    is_archived: bool = False,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[ApplicationResponse]:
    """List all job applications for the current user with optional filtering.

    Multi-tenant: Only returns applications belonging to current user (application.user_id == current_user.id).
    This is a critical security measure - users cannot access other users' data.

    Args:
        status: Filter by application status (e.g., INTERVIEW, OFFER)
        search: Filter by company name (case-insensitive substring match)
        is_archived: Show only archived applications if True, active if False
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return
        current_user: Authenticated user from JWT token
        db: Database session

    Returns:
        List[ApplicationResponse]: Filtered and paginated applications
    """
    # Start query: always filter by current user (MULTI-TENANCY ENFORCEMENT)
    query = db.query(Application).filter(
        Application.user_id == current_user.id,  # Security: only user's applications
        Application.is_archived == is_archived
    )

    # Optional filters applied in sequence
    if status:
        query = query.filter(Application.status == status)

    if search:
        # Case-insensitive LIKE search on company name
        query = query.filter(Application.company_name.ilike(f"%{search}%"))

    # Order by most recent applications first, then paginate
    applications = query.order_by(Application.date_applied.desc()).offset(skip).limit(limit).all()
    return applications


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApplicationResponse:
    """Create a new job application record.

    Automatically associates the application with the current user.

    Args:
        application_data: Application details (company, job title, status, date, etc.)
        current_user: Authenticated user from JWT token
        db: Database session

    Returns:
        ApplicationResponse: Created application with generated ID and timestamps
    """
    # Create new application, automatically setting user_id to current user
    new_application = Application(
        user_id=current_user.id,  # Associate with current user
        **application_data.dict()  # Unpack other fields from request schema
    )

    # Persist to database
    db.add(new_application)
    db.commit()
    db.refresh(new_application)  # Reload to get generated fields (id, created_at, updated_at)

    return new_application


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApplicationResponse:
    """Get a specific job application by ID.

    Multi-tenant: Can only access applications owned by current user.

    Args:
        application_id: UUID of the application to retrieve
        current_user: Authenticated user from JWT token
        db: Database session

    Returns:
        ApplicationResponse: The requested application

    Raises:
        HTTPException(404): If application not found or user doesn't own it
    """
    # Query with TWO filters: ID match AND user ownership (multi-tenancy)
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id  # Security check
    ).first()

    if not application:
        # Return 404 whether application doesn't exist or user doesn't own it
        # (don't reveal which for security)
        raise HTTPException(status_code=404, detail="Application not found")

    return application


@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: UUID,
    application_data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApplicationResponse:
    """Update an existing job application.

    Only the fields provided in the request are updated (partial update).
    Multi-tenant: Can only update applications owned by current user.

    Args:
        application_id: UUID of the application to update
        application_data: Fields to update (all optional)
        current_user: Authenticated user from JWT token
        db: Database session

    Returns:
        ApplicationResponse: Updated application

    Raises:
        HTTPException(404): If application not found or user doesn't own it
    """
    # Verify ownership before allowing update
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id  # Security check
    ).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Update only provided fields (exclude_unset=True skips None/default values)
    for field, value in application_data.dict(exclude_unset=True).items():
        setattr(application, field, value)

    # Persist changes
    db.commit()
    db.refresh(application)  # Reload to get updated_at timestamp

    return application


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> None:
    """Delete a job application permanently.

    This is a hard delete (removes from database). For soft delete, use the archive endpoint.
    Multi-tenant: Can only delete applications owned by current user.

    Args:
        application_id: UUID of the application to delete
        current_user: Authenticated user from JWT token
        db: Database session

    Raises:
        HTTPException(404): If application not found or user doesn't own it
    """
    # Verify ownership before allowing deletion
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id  # Security check
    ).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Remove from database
    db.delete(application)
    db.commit()

    return None


@router.patch("/{application_id}/archive", response_model=ApplicationResponse)
async def toggle_archive(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApplicationResponse:
    """Toggle archive status of a job application (soft delete).

    Archived applications are hidden from default views but not deleted.
    This is useful for hiding old or rejected applications without removing them.
    Multi-tenant: Can only archive applications owned by current user.

    Args:
        application_id: UUID of the application to archive/unarchive
        current_user: Authenticated user from JWT token
        db: Database session

    Returns:
        ApplicationResponse: Updated application with toggled is_archived flag

    Raises:
        HTTPException(404): If application not found or user doesn't own it
    """
    # Verify ownership before allowing archive toggle
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id  # Security check
    ).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Toggle archive flag (soft delete - record stays in database)
    application.is_archived = not application.is_archived
    db.commit()
    db.refresh(application)

    return application
