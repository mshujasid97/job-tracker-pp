from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from uuid import UUID
from ..database import get_db
from ..models.user import User
from ..models.application import Application, ApplicationStatus
from ..api.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

# Schemas
class ApplicationCreate(BaseModel):
    company_name: str
    job_title: str
    status: ApplicationStatus = ApplicationStatus.APPLIED
    date_applied: date
    job_url: Optional[str] = None
    notes: Optional[str] = None

class ApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    date_applied: Optional[date] = None
    job_url: Optional[str] = None
    notes: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: str
    company_name: str
    job_title: str
    status: ApplicationStatus
    date_applied: date
    job_url: Optional[str]
    notes: Optional[str]
    is_archived: bool
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True

# Routes
@router.get("/", response_model=List[ApplicationResponse])
async def get_applications(
    status: Optional[ApplicationStatus] = None,
    search: Optional[str] = None,
    is_archived: bool = False,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.is_archived == is_archived
    )
    
    if status:
        query = query.filter(Application.status == status)
    
    if search:
        query = query.filter(Application.company_name.ilike(f"%{search}%"))
    
    applications = query.order_by(Application.date_applied.desc()).offset(skip).limit(limit).all()
    return applications

@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_application = Application(
        user_id=current_user.id,
        **application_data.dict()
    )
    
    db.add(new_application)
    db.commit()
    db.refresh(new_application)
    
    return new_application

@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    return application

@router.put("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: UUID,
    application_data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    for field, value in application_data.dict(exclude_unset=True).items():
        setattr(application, field, value)
    
    db.commit()
    db.refresh(application)
    
    return application

@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    db.delete(application)
    db.commit()
    
    return None

@router.patch("/{application_id}/archive", response_model=ApplicationResponse)
async def toggle_archive(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    application.is_archived = not application.is_archived
    db.commit()
    db.refresh(application)
    
    return application