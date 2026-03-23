"""
API 路由 - 多 Agent 协作指挥中心
"""

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from typing import List
from sqlalchemy.orm import Session
from models import get_db
from core.agent_registry import AgentRegistry
from core.state_manager import StateManager

# 初始化全局组件
agent_registry = AgentRegistry()
state_manager = StateManager()

router = APIRouter()

# Agent 相关路由
@router.get("/agents")
async def list_agents(db: Session = Depends(get_db)):
    """获取所有 Agent 列表"""
    return agent_registry.list_agents()

@router.get("/agents/states")
async def get_agent_states():
    """获取所有 Agent 状态"""
    return state_manager.get_all_agent_states()

# 工作流相关路由
@router.get("/workflows/states")
async def get_workflow_states():
    """获取所有工作流状态"""
    return state_manager.get_all_workflow_states()

# WebSocket 路由
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket 实时通信端点"""
    await websocket.accept()
    try:
        while True:
            # 接收客户端消息
            data = await websocket.receive_json()
            # 处理消息（这里可以扩展）
            await websocket.send_json({"status": "received", "data": data})
    except WebSocketDisconnect:
        pass