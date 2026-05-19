from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, Date, ForeignKey, JSON, DateTime, CheckConstraint, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship, declarative_base
from ..emuns.enums import LocationEnum, ApplicationStatusEnum
from ..mixins.mixins import TimestampMixin, SoftDeleteMixin

Base = declarative_base()

class Job(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    department = Column(String, nullable=False)
    description = Column(String, nullable=False)
    location = Column(Enum(LocationEnum, native_enum=False), nullable=False)
    salary_min = Column(Integer, nullable=False)
    salary_max = Column(Integer, nullable=False)
    required_skills = Column(JSON, nullable=False) # Stored as JSON array of strings
    max_applicants = Column(Integer, nullable=True)
    deadline = Column(Date, nullable=False)
    is_closed = Column(Boolean, default=False, nullable=False)

    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint('salary_min < salary_max', name='check_salary_range'),
    )

class Application(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    applicant_name = Column(String, nullable=False)
    email = Column(String, index=True, nullable=False)
    years_experience = Column(Integer, nullable=False)
    cv_summary = Column(String(1000), nullable=False)
    linkedin_url = Column(String, nullable=True)
    status = Column(Enum(ApplicationStatusEnum, native_enum=False), default=ApplicationStatusEnum.pending, nullable=False)

    job = relationship("Job", back_populates="applications")
    status_history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint('years_experience >= 0', name='check_years_experience_positive'),
        # Enforcing duplicate application rule at the database level:
        # Same email cannot apply to the same job twice.
        UniqueConstraint('job_id', 'email', name='uix_job_email'),
    )

class ApplicationStatusHistory(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "application_status_history"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    previous_status = Column(Enum(ApplicationStatusEnum, native_enum=False), nullable=True)
    new_status = Column(Enum(ApplicationStatusEnum, native_enum=False), nullable=False)
    note = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    application = relationship("Application", back_populates="status_history")
