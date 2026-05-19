from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings"""
    database_url: str = "sqlite:///./app.db"
    
    class Config:
        env_file = ".env"

settings = Settings()
