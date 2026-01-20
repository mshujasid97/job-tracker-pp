"""Analytics endpoints for job application insights and statistics.

This module provides aggregated data about a user's job applications:
- Summary statistics: Total applications, status breakdown, success rate
- Timeline data: Applications submitted over time (useful for trend visualization)

All queries are multi-tenant and only calculate stats for the current user.
Data excludes archived applications by default.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from ..database import get_db
from ..models.user import User
from ..models.application import Application, ApplicationStatus
from ..api.auth import get_current_user
from pydantic import BaseModel
from typing import Dict, List

router = APIRouter()


class AnalyticsSummary(BaseModel):
    """Schema for analytics summary data returned to frontend for dashboard."""
    total_applications: int  # Total active (non-archived) applications
    status_breakdown: Dict[str, int]  # Count of applications by status (e.g., {"applied": 5, "interview": 2})
    applications_this_week: int  # Applications submitted in last 7 days
    applications_this_month: int  # Applications submitted in last 30 days
    success_rate: float  # Percentage of applications resulting in offer/accepted (0-100)


class TimelineData(BaseModel):
    """Schema for daily application submission timeline data."""
    date: str  # Date in YYYY-MM-DD format
    count: int  # Number of applications submitted on this date



# API Endpoints
@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> AnalyticsSummary:
    """Get analytics summary for the current user's job applications.
    
    Calculates key metrics useful for dashboard display:
    - Total application count
    - Breakdown by status (applied, screening, interview, offer, accepted, rejected)
    - Recent activity (this week, this month)
    - Success rate (percentage of applications leading to offers)
    
    Args:
        current_user: Authenticated user from JWT token
        db: Database session
    
    Returns:
        AnalyticsSummary: Aggregated statistics for the user's applications
    """
    # Count total active applications (exclude archived)
    total = db.query(Application).filter(
        Application.user_id == current_user.id,  # Multi-tenancy
        Application.is_archived == False
    ).count()
    
    # Group applications by status and count each group
    # Example: {"applied": 10, "screening": 3, "interview": 1, "offer": 0, "accepted": 0, "rejected": 1}
    status_counts = db.query(
        Application.status,
        func.count(Application.id)
    ).filter(
        Application.user_id == current_user.id,  # Multi-tenancy
        Application.is_archived == False
    ).group_by(Application.status).all()
    
    # Convert status enum to string keys for JSON response
    status_breakdown = {status.value: count for status, count in status_counts}
    
    # Count applications submitted in the last 7 days
    week_ago = datetime.utcnow().date() - timedelta(days=7)
    this_week = db.query(Application).filter(
        Application.user_id == current_user.id,  # Multi-tenancy
        Application.date_applied >= week_ago,
        Application.is_archived == False
    ).count()
    
    # Count applications submitted in the last 30 days
    month_ago = datetime.utcnow().date() - timedelta(days=30)
    this_month = db.query(Application).filter(
        Application.user_id == current_user.id,  # Multi-tenancy
        Application.date_applied >= month_ago,
        Application.is_archived == False
    ).count()
    
    # Calculate success rate: percentage of applications with positive outcome (OFFER or ACCEPTED)
    # This metric shows conversion from "applied" to "offer or accepted"
    offers = status_breakdown.get(ApplicationStatus.OFFER.value, 0) + \
             status_breakdown.get(ApplicationStatus.ACCEPTED.value, 0)
    success_rate = (offers / total * 100) if total > 0 else 0.0
    
    return {
        "total_applications": total,
        "status_breakdown": status_breakdown,
        "applications_this_week": this_week,
        "applications_this_month": this_month,
        "success_rate": round(success_rate, 2) # round to 2 decimal places
    }



@router.get("/timeline", response_model=List[TimelineData])
async def get_timeline(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[TimelineData]:
    """Get daily application submission timeline data.
    
    Returns count of applications submitted on each date over the specified time period.
    Useful for visualizing trends and activity patterns (e.g., in a chart).
    
    Args:
        days: Number of days to look back (default: 30 days)
        current_user: Authenticated user from JWT token
        db: Database session
    
    Returns:
        List[TimelineData]: Daily submission counts from start_date to today
    """
    # Calculate start date: today minus N days
    start_date = datetime.utcnow().date() - timedelta(days=days)
    
    # Query: group by date_applied, count applications per day
    # Result: [(date1, count1), (date2, count2), ...] ordered by date ascending
    timeline_data = db.query(
        Application.date_applied,
        func.count(Application.id)
    ).filter(
        Application.user_id == current_user.id,  # Multi-tenancy
        Application.date_applied >= start_date,
        Application.is_archived == False
    ).group_by(Application.date_applied).order_by(Application.date_applied).all()
    
    return [
        {"date": str(date), "count": count}
        for date, count in timeline_data
    ]