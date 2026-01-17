"""
Application Configuration
Loads environment variables and provides typed settings.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Keys
    google_api_key: str
    browserbase_api_key: Optional[str] = None
    browserbase_project_id: Optional[str] = None
    
    # PostgreSQL (shared with collegefinder backend)
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "collegefinder_db"
    db_user: str = "postgres"
    db_password: str = "postgres"
    
    # Connection pool settings
    db_min_pool_size: int = 5
    db_max_pool_size: int = 20
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # Email SMTP
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    
    # Captcha (optional)
    captcha_provider: Optional[str] = None
    captcha_api_key: Optional[str] = None
    
    # External Services
    collegefinder_url: str = "http://localhost:5001/api"  # Collegefinder backend
    stagehand_url: str = "http://localhost:3001"  # Stagehand browser automation
    frontend_url: str = "http://localhost:3000"  # Frontend for email links
    
    @property
    def database_url(self) -> str:
        """Generate PostgreSQL connection URL."""
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


# Global settings instance
settings = Settings()
