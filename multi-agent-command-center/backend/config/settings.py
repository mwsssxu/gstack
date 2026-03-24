"""
配置文件 - 多 Agent 协作指挥中心
"""

from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # 服务器配置
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS 配置
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # 数据库配置
    SQLITE_DATABASE_URL: str = "sqlite:///./command_center.db"
    POSTGRESQL_DATABASE_URL: str = "postgresql://postgres:0okm9ijn@localhost:5432/postgres"
    MONGODB_DATABASE_URL: str = "mongodb://localhost:27017/command_center"
    
    # Redis 配置
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = "re2019"
    REDIS_DB: int = 0
    
    # LLM API 配置
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    
    # 存储配置
    ARTIFACTS_DIR: str = "~/.command-center/artifacts"
    SCREENSHOTS_DIR: str = "~/.command-center/screenshots"
    
    # 浏览器配置
    BROWSER_HEADLESS: bool = True
    BROWSER_TIMEOUT: int = 30000  # 30 seconds
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()