from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from sqlalchemy.exc import IntegrityError
from datetime import date, datetime
from typing import List, Optional

from .core.database import SessionLocal, engine
from .models.models import Base, Job, Application, ApplicationStatusHistory
from .schemas.schemas import (
    JobCreate, JobUpdate, JobResponse, ApplicationCreate, ApplicationResponse, 
    ApplicationStatusUpdate, ApplicationStatusHistoryResponse, StatsResponse
)
from .emuns.enums import ApplicationStatusEnum, LocationEnum
from .dependencies.dependencies import get_db

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="JobBoard Pro API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Feature 1 & 2: Job Management - Create & Browse Jobs
# ---------------------------------------------------------

@app.post("/api/jobs", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    """Create a new job listing"""
    
    # Validate salary range
    if job.salary_min >= job.salary_max:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="salary_min must be strictly less than salary_max"
        )
    
    db_job = Job(
        title=job.title,
        department=job.department,
        description=job.description,
        location=job.location,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        required_skills=job.required_skills,
        max_applicants=job.max_applicants,
        deadline=job.deadline,
        is_closed=False
    )
    
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    
    return db_job


@app.get("/api/jobs", response_model=dict)
def browse_jobs(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    department: Optional[str] = None,
    location: Optional[LocationEnum] = None,
    skill: Optional[str] = None,
    include_closed: bool = False,
    db: Session = Depends(get_db)
):
    """
    Browse and search job listings with pagination and filtering
    
    - Filter by department, location, and/or skill
    - Default: only non-expired, open listings
    - Use include_closed=true to see past-deadline or closed listings
    """
    
    query = db.query(Job)
    
    # Filter: exclude closed jobs and expired deadlines (unless include_closed=true)
    if not include_closed:
        query = query.filter(
            and_(
                Job.is_closed == False,
                Job.deadline >= date.today(),
                Job.is_deleted == False
            )
        )
    else:
        query = query.filter(Job.is_deleted == False)
    
    # Apply filters
    if department:
        query = query.filter(Job.department == department)
    
    if location:
        query = query.filter(Job.location == location)
    
    if skill:
        # Filter jobs where the skill appears in required_skills JSON array
        # This is database-agnostic by fetching and filtering in Python
        jobs_list = query.all()
        jobs_list = [
            j for j in jobs_list 
            if skill in j.required_skills
        ]
        query = None
    
    # Get total count
    if query is not None:
        total_count = query.count()
        jobs_list = query.offset((page - 1) * per_page).limit(per_page).all()
    else:
        total_count = len(jobs_list)
        jobs_list = jobs_list[(page - 1) * per_page:(page - 1) * per_page + per_page]
    
    return {
        "total_count": total_count,
        "page": page,
        "per_page": per_page,
        "results": [JobResponse.from_orm(job) for job in jobs_list]
    }


@app.get("/api/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get a specific job listing"""
    job = db.query(Job).filter(
        and_(Job.id == job_id, Job.is_deleted == False)
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return job


@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    """Soft delete a job listing"""
    
    # Check if job exists
    job = db.query(Job).filter(
        and_(Job.id == job_id, Job.is_deleted == False)
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Soft delete the job
    job.is_deleted = True
    job.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Job deleted successfully"}


@app.put("/api/jobs/{job_id}", response_model=JobResponse)
def update_job(job_id: int, job_update: JobUpdate, db: Session = Depends(get_db)):
    """Update a job listing"""
    
    # Check if job exists
    job = db.query(Job).filter(
        and_(Job.id == job_id, Job.is_deleted == False)
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Validate salary range if both values are provided
    if job_update.salary_min is not None and job_update.salary_max is not None:
        if job_update.salary_min >= job_update.salary_max:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="salary_min must be strictly less than salary_max"
            )
    
    # Update only provided fields
    update_data = job_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)
    
    job.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(job)
    
    return job


# ---------------------------------------------------------
# Feature 3: Apply to a Job
# ---------------------------------------------------------

@app.post("/api/jobs/{job_id}/applications", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_job(
    job_id: int,
    application: ApplicationCreate,
    db: Session = Depends(get_db)
):
    """
    Submit an application to a job listing
    
    Business rules:
    - Cannot apply after the listing deadline
    - Cannot apply to a closed listing
    - Cannot apply if max_applicants has been reached
    - Duplicate applications (same email + same job) return a conflict error
    """
    
    # Check if job exists
    job = db.query(Job).filter(
        and_(Job.id == job_id, Job.is_deleted == False)
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check if job is closed
    if job.is_closed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot apply to a closed job listing"
        )
    
    # Check if deadline has passed
    if date.today() > job.deadline:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application deadline has passed"
        )
    
    # Check if max_applicants has been reached
    if job.max_applicants:
        current_applications = db.query(func.count(Application.id)).filter(
            and_(
                Application.job_id == job_id,
                Application.is_deleted == False
            )
        ).scalar()
        
        if current_applications >= job.max_applicants:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum number of applicants has been reached for this job"
            )
    
    # Check for duplicate application (same email + same job), case-insensitive
    email_norm = application.email.strip().lower()
    existing_app = db.query(Application).filter(
        and_(
            Application.job_id == job_id,
            func.lower(Application.email) == email_norm,
            Application.is_deleted == False
        )
    ).first()
    
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this job with this email address. Duplicate applications are not allowed."
        )
    
    # Create new application
    db_application = Application(
        job_id=job_id,
        applicant_name=application.applicant_name,
        email=email_norm,
        years_experience=application.years_experience,
        cv_summary=application.cv_summary,
        linkedin_url=application.linkedin_url,
        status=ApplicationStatusEnum.pending
    )
    
    db.add(db_application)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied to this job with this email address. Duplicate applications are not allowed."
        )
    db.refresh(db_application)
    
    # Create initial status history entry
    history = ApplicationStatusHistory(
        application_id=db_application.id,
        previous_status=None,
        new_status=ApplicationStatusEnum.pending,
        note="Application submitted"
    )
    db.add(history)
    db.commit()
    
    return db_application


# ---------------------------------------------------------
# Feature 4: Application Status Workflow
# ---------------------------------------------------------

# Valid status transitions
VALID_TRANSITIONS = {
    ApplicationStatusEnum.pending: [
        ApplicationStatusEnum.shortlisted,
        ApplicationStatusEnum.rejected
    ],
    ApplicationStatusEnum.shortlisted: [
        ApplicationStatusEnum.offered,
        ApplicationStatusEnum.rejected
    ],
    ApplicationStatusEnum.offered: [
        ApplicationStatusEnum.rejected
    ],
    ApplicationStatusEnum.rejected: []  # No transitions from rejected
}


@app.get("/api/applications/status-transitions", response_model=dict)
def get_application_status_transitions():
    """Return the valid application status transition map for the frontend."""
    return {
        status.value: [next_status.value for next_status in next_statuses]
        for status, next_statuses in VALID_TRANSITIONS.items()
    }


@app.get("/api/applications", response_model=dict)
def get_all_applications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    job_id: Optional[int] = None,
    status: Optional[ApplicationStatusEnum] = None,
    email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all applications with optional filtering and pagination
    """
    query = db.query(Application).filter(Application.is_deleted == False)

    if job_id is not None:
        query = query.filter(Application.job_id == job_id)
    
    if status is not None:
        query = query.filter(Application.status == status)
    
    if email is not None:
        email_norm = email.strip().lower()
        query = query.filter(func.lower(Application.email) == email_norm)

    total_count = query.count()
    applications = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total_count": total_count,
        "page": page,
        "per_page": per_page,
        "results": [ApplicationResponse.from_orm(app) for app in applications]
    }


@app.get("/api/jobs/{job_id}/applications", response_model=dict)
def get_job_applications(
    job_id: int,
    filter_status: Optional[ApplicationStatusEnum] = None,
    db: Session = Depends(get_db)
):
    """
    Get all applications for a job with optional status filtering
    """
    
    # Verify job exists
    job = db.query(Job).filter(
        and_(Job.id == job_id, Job.is_deleted == False)
    ).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    query = db.query(Application).filter(
        and_(
            Application.job_id == job_id,
            Application.is_deleted == False
        )
    )
    
    if filter_status:
        query = query.filter(Application.status == filter_status)
    
    applications = query.all()
    
    return {
        "job_id": job_id,
        "status_filter": filter_status,
        "total": len(applications),
        "results": [ApplicationResponse.from_orm(app) for app in applications]
    }


@app.put("/api/applications/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: int,
    update: ApplicationStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update application status with status transition validation
    
    Rules:
    - Status can only move forward or to rejected (no backwards transitions)
    - Every status change requires a note
    - Status history is preserved as a log
    """
    
    # Get application
    application = db.query(Application).filter(
        and_(Application.id == application_id, Application.is_deleted == False)
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    current_status = application.status
    new_status = update.status
    allowed_statuses = VALID_TRANSITIONS.get(current_status, [])
    
    # Check if transition is valid
    if new_status not in allowed_statuses:
        allowed_values = [status.value for status in allowed_statuses]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid status transition from {current_status.value} to {new_status.value}. "
                f"Allowed next statuses: {allowed_values}"
            )
        )
    
    # Update status
    application.status = new_status
    application.updated_at = datetime.utcnow()
    
    # Create status history entry
    history = ApplicationStatusHistory(
        application_id=application_id,
        previous_status=current_status,
        new_status=new_status,
        note=update.note
    )
    
    db.add(history)
    db.commit()
    db.refresh(application)
    
    return application


@app.get("/api/applications/{application_id}/status-history", response_model=List[ApplicationStatusHistoryResponse])
def get_application_status_history(
    application_id: int,
    db: Session = Depends(get_db)
):
    """Get the complete status history for an application"""
    
    # Verify application exists
    application = db.query(Application).filter(
        and_(Application.id == application_id, Application.is_deleted == False)
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    history = db.query(ApplicationStatusHistory).filter(
        and_(
            ApplicationStatusHistory.application_id == application_id,
            ApplicationStatusHistory.is_deleted == False
        )
    ).order_by(ApplicationStatusHistory.timestamp.asc()).all()
    
    return history


# ---------------------------------------------------------
# Feature 5: Analytics Endpoint
# ---------------------------------------------------------

@app.get("/api/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """
    Get live analytics about the platform
    """
    
    today = date.today()
    
    # Total jobs
    total_jobs = db.query(func.count(Job.id)).filter(
        Job.is_deleted == False
    ).scalar()
    
    # Open jobs (not expired, not closed)
    open_jobs = db.query(func.count(Job.id)).filter(
        and_(
            Job.is_deleted == False,
            Job.is_closed == False,
            Job.deadline >= today
        )
    ).scalar()
    
    # Closed jobs (expired or manually closed)
    closed_jobs = db.query(func.count(Job.id)).filter(
        and_(
            Job.is_deleted == False,
            (Job.is_closed == True) | (Job.deadline < today)
        )
    ).scalar()
    
    # Total applications
    total_applications = db.query(func.count(Application.id)).filter(
        Application.is_deleted == False
    ).scalar()
    
    # Average applications per job
    jobs_with_apps = db.query(func.count(Application.id)).filter(
        Application.is_deleted == False
    ).scalar()
    avg_applications_per_job = jobs_with_apps / total_jobs if total_jobs > 0 else 0.0
    
    # Top department by application count
    top_dept = db.query(
        Job.department,
        func.count(Application.id).label('app_count')
    ).join(
        Application, Job.id == Application.job_id
    ).filter(
        and_(Job.is_deleted == False, Application.is_deleted == False)
    ).group_by(
        Job.department
    ).order_by(func.count(Application.id).desc()).first()
    
    top_department = top_dept[0] if top_dept else None
    
    return StatsResponse(
        total_jobs=total_jobs,
        open_jobs=open_jobs,
        closed_jobs=closed_jobs,
        total_applications=total_applications,
        avg_applications_per_job=round(avg_applications_per_job, 2),
        top_department=top_department
    )


# ---------------------------------------------------------
# Health Check
# ---------------------------------------------------------

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
