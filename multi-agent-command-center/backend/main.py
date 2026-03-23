#!/usr/bin/env python3
"""
多 Agent 协作指挥中心 - 主入口文件
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from api.routes import router as api_router, agent_registry, state_manager
from core.event_bus import EventBus
from core.workflow_engine import WorkflowEngine
from models import init_db

def create_app() -> FastAPI:
    """创建 FastAPI 应用实例"""
    # 初始化数据库
    init_db()
    
    # 初始化事件总线
    event_bus = EventBus()
    
    # 初始化工作流引擎
    workflow_engine = WorkflowEngine(agent_registry, state_manager, event_bus)
    
    app = FastAPI(
        title="Multi-Agent Command Center",
        description="多 Agent 协作指挥中心 API",
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
    
    # 注册路由
    app.include_router(api_router, prefix="/api")
    
    return app

if __name__ == "__main__":
    app = create_app()
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )