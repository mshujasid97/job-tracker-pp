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

# Schemas
class AnalyticsSummary(BaseModel):
    total_applications: int
    status_breakdown: Dict[str, int]
    applications_this_week: int
    applications_this_month: int
    success_rate: float

class TimelineData(BaseModel):
    date: str
    count: int

# Routes
@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Total applications
    total = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.is_archived == False
    ).count()
    
    # Status breakdown
    status_counts = db.query(
        Application.status,
        func.count(Application.id)
    ).filter(
        Application.user_id == current_user.id,
        Application.is_archived == False
    ).group_by(Application.status).all()
    
    status_breakdown = {status.value: count for status, count in status_counts}
    
    # Applications this week
    week_ago = datetime.utcnow().date() - timedelta(days=7)
    this_week = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.date_applied >= week_ago,
        Application.is_archived == False
    ).count()
    
    # Applications this month
    month_ago = datetime.utcnow().date() - timedelta(days=30)
    this_month = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.date_applied >= month_ago,
        Application.is_archived == False
    ).count()
    
    # Success rate (offers / total)
    offers = status_breakdown.get(ApplicationStatus.OFFER.value, 0) + \
             status_breakdown.get(ApplicationStatus.ACCEPTED.value, 0)
    success_rate = (offers / total * 100) if total > 0 else 0.0
    
    return {
        "total_applications": total,
        "status_breakdown": status_breakdown,
        "applications_this_week": this_week,
        "applications_this_month": this_month,
        "success_rate": round(success_rate, 2)
    }

@router.get("/timeline", response_model=List[TimelineData])
async def get_timeline(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    start_date = datetime.utcnow().date() - timedelta(days=days)
    
    timeline_data = db.query(
        Application.date_applied,
        func.count(Application.id)
    ).filter(
        Application.user_id == current_user.id,
        Application.date_applied >= start_date,
        Application.is_archived == False
    ).group_by(Application.date_applied).order_by(Application.date_applied).all()
    
    return [
        {"date": str(date), "count": count}
        for date, count in timeline_data
    ]