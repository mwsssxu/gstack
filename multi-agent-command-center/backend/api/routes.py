"""
API 路由 - 多 Agent 协作指挥中心
"""

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from models import get_db
from agents.product_thinker import ProductThinkerAgent
from agents.strategy_planner import StrategyPlannerAgent
from core.agent_registry import AgentRegistry
from core.state_manager import StateManager
import logging

logger = logging.getLogger(__name__)

# 初始化全局组件
agent_registry = AgentRegistry()
state_manager = StateManager()

# 注册默认 Agent
product_thinker = ProductThinkerAgent()
agent_registry.register_agent(product_thinker, {"enabled": True, "priority": 1})

strategy_planner = StrategyPlannerAgent()
agent_registry.register_agent(strategy_planner, {"enabled": True, "priority": 2})

# Pydantic 模型
class WorkflowExecuteRequest(BaseModel):
    """工作流执行请求"""
    workflow_id: str
    user_idea: str

class AgentExecuteRequest(BaseModel):
    """Agent 执行请求"""
    context: Dict[str, Any]

router = APIRouter()

# Agent 相关路由
@router.get("/agents")
async def list_agents():
    """获取所有 Agent 列表"""
    agents = agent_registry.list_agents()
    return {"status": "success", "data": agents, "count": len(agents)}

@router.get("/agents/{agent_name}")
async def get_agent(agent_name: str):
    """获取单个 Agent 信息"""
    agent = agent_registry.get_agent(agent_name)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_name} not found")
    return {"status": "success", "data": agent.get_info()}

@router.post("/agents/{agent_name}/execute")
async def execute_agent(agent_name: str, request: AgentExecuteRequest):
    """执行指定的 Agent"""
    agent = agent_registry.get_agent(agent_name)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_name} not found")
    
    try:
        result = await agent.execute(request.context)
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Agent execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agents/states")
async def get_agent_states():
    """获取所有 Agent 状态"""
    agents = agent_registry.list_agents()
    states = [{"name": a["name"], "status": a.get("status", "idle")} for a in agents]
    return {"status": "success", "data": states}

# 工作流相关路由
@router.get("/workflows/states")
async def get_workflow_states():
    """获取所有工作流状态"""
    # TODO: 实现工作流状态查询
    return {"status": "success", "data": [], "count": 0}

@router.post("/workflows/execute")
async def execute_workflow(request: WorkflowExecuteRequest):
    """执行工作流"""
    try:
        # 简单工作流：执行 ProductThinker
        agent = agent_registry.get_agent("product_thinker")
        if not agent:
            raise HTTPException(status_code=404, detail="ProductThinker agent not found")
        
        result = await agent.execute({"user_idea": request.user_idea})
        return {
            "status": "success",
            "workflow_id": request.workflow_id,
            "data": result
        }
    except Exception as e:
        logger.error(f"Workflow execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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