"""
数据库初始化和连接管理
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

# 根据配置选择数据库URL
def get_database_url():
    """获取数据库URL"""
    # 默认使用 SQLite，避免 PostgreSQL 连接问题
    return settings.SQLITE_DATABASE_URL
    
    # 如果需要使用 PostgreSQL，取消下面的注释
    # if "postgresql" in settings.POSTGRESQL_DATABASE_URL:
    #     return settings.POSTGRESQL_DATABASE_URL
    # elif "mongodb" in settings.MONGODB_DATABASE_URL:
    #     # MongoDB 需要特殊处理，这里返回 None 表示使用其他方式
    #     return None
    # else:
    #     # 默认使用 SQLite
    #     return settings.SQLITE_DATABASE_URL

# 创建数据库引擎
database_url = get_database_url()
if database_url:
    engine = create_engine(
        database_url,
        echo=settings.DEBUG,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    def get_db():
        """获取数据库会话"""
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
else:
    # MongoDB 或其他数据库的处理
    engine = None
    SessionLocal = None
    get_db = None

def init_db():
    """初始化数据库"""
    if engine:
        from .database import Base
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
    else:
        logger.info("Using alternative database backend (MongoDB)")

# Redis 连接
import redis

def get_redis_client():
    """获取 Redis 客户端"""
    return redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
        db=settings.REDIS_DB,
        decode_responses=True
    )