from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/security_scanner"
    
    # JWT
    SECRET_KEY: str = "9a7f3e5b2d1c8f4a6e9d2c5a1f8b3e7d0a4c6f2e5b8d1a3c7f4e6b9d2a5c8f"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # App
    APP_NAME: str = "Web App Security Audit"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra fields from .env

settings = Settings()