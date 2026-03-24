#!/usr/bin/env python3
"""
简化版测试应用 - 多 Agent 协作指挥中心
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings

def create_app() -> FastAPI:
    """创建简化版 FastAPI 应用实例"""
    app = FastAPI(
        title="Multi-Agent Command Center Test",
        description="多 Agent 协作指挥中心测试 API",
        version="0.1.0"
    )
    
    # 配置 CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.get("/health")
    async def health_check():
        return {"status": "ok", "message": "Backend is running!"}
    
    return app

if __name__ == "__main__":
    app = create_app()
    uvicorn.run(
        app,
        host=settings.HOST,
        port=8001,  # 使用不同端口
        reload=False
    )