from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator
from typing import List, Optional
from datetime import date, datetime
from ..models.models import LocationEnum, ApplicationStatusEnum

# ---------------------------------------------------------
# Job Schemas
# ---------------------------------------------------------

class JobBase(BaseModel):
    title: str = Field(..., example="Software Engineer")
    department: str = Field(..., example="Engineering")
    description: str = Field(..., example="We are looking for a backend engineer.")
    location: LocationEnum
    salary_min: int = Field(..., example=80000)
    salary_max: int = Field(..., example=120000)
    required_skills: List[str] = Field(..., min_length=1, example=["Python", "FastAPI"])
    max_applicants: Optional[int] = Field(None, example=50)
    deadline: date

    @field_validator('salary_max')
    def check_salary(cls, v, info):
        if 'salary_min' in info.data and v <= info.data['salary_min']:
            raise ValueError('salary_max must be strictly greater than salary_min')
        return v

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = Field(None, example="Software Engineer")
    department: Optional[str] = Field(None, example="Engineering")
    description: Optional[str] = Field(None, example="We are looking for a backend engineer.")
    location: Optional[LocationEnum] = None
    salary_min: Optional[int] = Field(None, example=80000)
    salary_max: Optional[int] = Field(None, example=120000)
    required_skills: Optional[List[str]] = Field(None, min_length=1, example=["Python", "FastAPI"])
    max_applicants: Optional[int] = Field(None, example=50)
    deadline: Optional[date] = None
    is_closed: Optional[bool] = None

    @field_validator('salary_max')
    def check_salary(cls, v, info):
        if v is not None and 'salary_min' in info.data and info.data['salary_min'] is not None and v <= info.data['salary_min']:
            raise ValueError('salary_max must be strictly greater than salary_min')
        return v

class JobResponse(JobBase):
    id: int
    is_closed: bool

    class Config:
        from_attributes = True

# ---------------------------------------------------------
# Application Schemas
# ---------------------------------------------------------

class ApplicationBase(BaseModel):
    applicant_name: str = Field(..., example="John Doe")
    email: EmailStr = Field(..., example="john.doe@example.com")
    years_experience: int = Field(..., ge=0, example=5)
    cv_summary: str = Field(..., max_length=1000, example="Experienced software engineer with 5 years in Python.")
    linkedin_url: Optional[str] = Field(None, example="https://linkedin.com/in/johndoe")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator('linkedin_url')
    def check_linkedin_url(cls, v):
        if v is not None and not (v.startswith("https://linkedin.com/") or v.startswith("https://www.linkedin.com/")):
            raise ValueError('linkedin_url must begin with https://linkedin.com/ or https://www.linkedin.com/')
        return v

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationResponse(ApplicationBase):
    id: int
    job_id: int
    status: ApplicationStatusEnum

    class Config:
        from_attributes = True

# ---------------------------------------------------------
# Application Status History Schemas
# ---------------------------------------------------------

class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatusEnum
    note: str = Field(..., min_length=1, example="Applicant passed the initial screening.")

class ApplicationStatusHistoryResponse(BaseModel):
    id: int
    application_id: int
    previous_status: Optional[ApplicationStatusEnum]
    new_status: ApplicationStatusEnum
    note: str
    timestamp: datetime

    class Config:
        from_attributes = True

# ---------------------------------------------------------
# Stats Analytics Schema
# ---------------------------------------------------------

class StatsResponse(BaseModel):
    total_jobs: int
    open_jobs: int
    closed_jobs: int
    total_applications: int
    avg_applications_per_job: float
    top_department: Optional[str]
