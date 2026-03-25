"""
API 路由 - 多 Agent 协作指挥中心
"""

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from models import get_db
from agents.product_thinker import ProductThinkerAgent
from agents.strategy_planner import StrategyPlannerAgent
from agents.paranoid_expert import ParanoidExpertAgent
from agents.quality_expert import QualityExpertAgent
from agents.architect import ArchitectAgent
from agents.release_expert import ReleaseExpertAgent
from core.agent_registry import AgentRegistry
from core.state_manager import StateManager
from core.quality_workflow import QualityWorkflowEngine
from core.event_bus import EventBus
from services.session_service import SessionService
from services.broadcast import manager as ws_manager
import logging
import time
import uuid

logger = logging.getLogger(__name__)

# 初始化全局组件
agent_registry = AgentRegistry()
state_manager = StateManager()
event_bus = EventBus()
quality_workflow = QualityWorkflowEngine(agent_registry, event_bus)

# 注册默认 Agent
product_thinker = ProductThinkerAgent()
agent_registry.register_agent(product_thinker, {"enabled": True, "priority": 1})

strategy_planner = StrategyPlannerAgent()
agent_registry.register_agent(strategy_planner, {"enabled": True, "priority": 2})

paranoid_expert = ParanoidExpertAgent()
agent_registry.register_agent(paranoid_expert, {"enabled": True, "priority": 3})

quality_expert = QualityExpertAgent()
agent_registry.register_agent(quality_expert, {"enabled": True, "priority": 4})

architect = ArchitectAgent()
agent_registry.register_agent(architect, {"enabled": True, "priority": 5})

release_expert = ReleaseExpertAgent()
agent_registry.register_agent(release_expert, {"enabled": True, "priority": 6})

# Pydantic 模型
class WorkflowExecuteRequest(BaseModel):
    """工作流执行请求"""
    workflow_id: str
    user_idea: str

class AgentExecuteRequest(BaseModel):
    """Agent 执行请求"""
    context: Dict[str, Any]
    session_id: Optional[str] = None  # 可选的会话ID

class CreateSessionRequest(BaseModel):
    """创建会话请求"""
    title: Optional[str] = None

class ResumeExecutionRequest(BaseModel):
    """恢复执行请求"""
    session_id: str
    next_agent: Optional[str] = None

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
async def execute_agent(
    agent_name: str,
    request: AgentExecuteRequest,
    db: Session = Depends(get_db)
):
    """执行指定的 Agent"""
    agent = agent_registry.get_agent(agent_name)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_name} not found")
    
    # 初始化会话服务
    session_service = SessionService(db)
    
    # 获取或创建会话
    session = session_service.get_or_create_session(request.session_id)
    
    # 获取步骤索引
    last_execution = session_service.get_last_execution(session.session_id)
    step_index = (last_execution.step_index + 1) if last_execution else 0
    
    # 记录执行开始
    user_idea = request.context.get("user_idea", "")
    execution = session_service.record_execution(
        session_id=session.session_id,
        agent_name=agent_name,
        user_input=user_idea,
        step_index=step_index,
        status='running'
    )
    
    # 广播执行开始事件
    await ws_manager.broadcast_agent_status(agent_name, 'running', {
        'session_id': session.session_id,
        'step_index': step_index
    })
    await ws_manager.broadcast_execution_started(session.session_id, agent_name, step_index)
    
    start_time = time.time()
    
    try:
        result = await agent.execute(request.context)
        
        # 记录执行成功
        execution_time = int((time.time() - start_time) * 1000)
        output_type = 'design_document' if 'design_document' in result else 'implementation_plan'
        output_result = result.get('design_document') or result.get('implementation_plan', '')
        
        session_service.update_execution(
            execution_id=execution.id,
            status='completed',
            output_result=output_result,
            output_type=output_type,
            used_fallback=result.get('used_fallback', False),
            execution_time=execution_time
        )
        
        # 添加消息记录
        session_service.add_message(
            session_id=session.session_id,
            role='user',
            content=user_idea
        )
        session_service.add_message(
            session_id=session.session_id,
            role='assistant',
            content=output_result,
            agent_name=agent_name
        )
        
        # 在结果中添加会话信息
        result['session_id'] = session.session_id
        result['step_index'] = step_index
        
        # 广播执行完成事件
        result_summary = output_result[:100] + '...' if len(output_result) > 100 else output_result
        await ws_manager.broadcast_agent_status(agent_name, 'completed', {
            'session_id': session.session_id,
            'step_index': step_index,
            'execution_time': execution_time
        })
        await ws_manager.broadcast_execution_completed(session.session_id, agent_name, step_index, result_summary)
        
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Agent execution failed: {e}")
        
        # 记录执行失败
        session_service.update_execution(
            execution_id=execution.id,
            status='error',
            error_message=str(e)
        )
        
        # 广播执行错误事件
        await ws_manager.broadcast_agent_status(agent_name, 'error', {
            'session_id': session.session_id,
            'error': str(e)
        })
        await ws_manager.broadcast_execution_error(session.session_id, agent_name, str(e))
        
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
    """执行完整工作流（带质量门禁）"""
    try:
        # 执行质量门禁工作流
        result = await quality_workflow.execute_full_workflow(
            user_idea=request.user_idea,
            session_id=request.workflow_id
        )
        return {
            "status": "success" if result.get("status") == "completed" else "partial",
            "data": result
        }
    except Exception as e:
        logger.error(f"Workflow execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/workflows/quick")
async def execute_quick_workflow(request: WorkflowExecuteRequest):
    """执行快速工作流（仅产品思考者）"""
    try:
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
async def websocket_endpoint(websocket: WebSocket, session_id: Optional[str] = None):
    """WebSocket 实时通信端点"""
    await ws_manager.connect(websocket, session_id)
    try:
        while True:
            # 接收客户端消息
            data = await websocket.receive_json()
            
            # 处理心跳
            if data.get("type") == "heartbeat":
                await ws_manager.send_to_connection(websocket, {
                    "type": "heartbeat.ack",
                    "data": {"timestamp": datetime.utcnow().isoformat()}
                })
                continue
            
            # 处理订阅会话
            if data.get("type") == "subscribe.session":
                sid = data.get("session_id")
                if sid:
                    ws_manager.connection_metadata[websocket]["session_id"] = sid
                    if sid not in ws_manager.session_connections:
                        ws_manager.session_connections[sid] = []
                    ws_manager.session_connections[sid].append(websocket)
                    await ws_manager.send_to_connection(websocket, {
                        "type": "session.subscribed",
                        "data": {"session_id": sid}
                    })
                continue
            
            # 其他消息类型
            await ws_manager.send_to_connection(websocket, {
                "type": "message.received",
                "data": data
            })
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)


# ============ 会话管理路由 ============

@router.post("/sessions")
async def create_session(
    request: CreateSessionRequest,
    db: Session = Depends(get_db)
):
    """创建新会话"""
    session_service = SessionService(db)
    session = session_service.create_session(title=request.title)
    return {
        "status": "success",
        "data": {
            "session_id": session.session_id,
            "title": session.title,
            "status": session.status,
            "created_at": session.created_at.isoformat() if session.created_at else None
        }
    }

@router.get("/sessions")
async def list_sessions(db: Session = Depends(get_db)):
    """列出所有会话"""
    session_service = SessionService(db)
    sessions = session_service.list_sessions()
    return {
        "status": "success",
        "data": [
            {
                "session_id": s.session_id,
                "title": s.title,
                "status": s.status,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None
            }
            for s in sessions
        ]
    }

@router.get("/sessions/{session_id}")
async def get_session(session_id: str, db: Session = Depends(get_db)):
    """获取会话详情"""
    session_service = SessionService(db)
    context = session_service.get_session_context(session_id)
    if not context:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return {"status": "success", "data": context}

@router.get("/sessions/{session_id}/executions")
async def get_session_executions(session_id: str, db: Session = Depends(get_db)):
    """获取会话的执行记录"""
    session_service = SessionService(db)
    executions = session_service.get_session_executions(session_id)
    return {
        "status": "success",
        "data": [
            {
                "id": e.id,
                "agent_name": e.agent_name,
                "step_index": e.step_index,
                "status": e.status,
                "user_input": e.user_input,
                "output_result": e.output_result,
                "output_type": e.output_type,
                "used_fallback": e.used_fallback,
                "execution_time": e.execution_time,
                "started_at": e.started_at.isoformat() if e.started_at else None,
                "completed_at": e.completed_at.isoformat() if e.completed_at else None
            }
            for e in executions
        ]
    }

@router.get("/sessions/{session_id}/messages")
async def get_session_messages(session_id: str, db: Session = Depends(get_db)):
    """获取会话的消息记录"""
    session_service = SessionService(db)
    messages = session_service.get_session_messages(session_id)
    return {
        "status": "success",
        "data": [
            {
                "role": m.role,
                "content": m.content,
                "agent_name": m.agent_name,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in messages
        ]
    }

@router.post("/sessions/{session_id}/pause")
async def pause_session(session_id: str, db: Session = Depends(get_db)):
    """暂停会话"""
    session_service = SessionService(db)
    session = session_service.pause_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return {"status": "success", "data": {"session_id": session.session_id, "status": session.status}}

@router.post("/sessions/{session_id}/complete")
async def complete_session(session_id: str, db: Session = Depends(get_db)):
    """完成会话"""
    session_service = SessionService(db)
    session = session_service.complete_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return {"status": "success", "data": {"session_id": session.session_id, "status": session.status}}

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, db: Session = Depends(get_db)):
    """删除会话"""
    session_service = SessionService(db)
    if not session_service.delete_session(session_id):
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return {"status": "success", "message": "Session deleted"}

@router.post("/sessions/resume")
async def resume_execution(request: ResumeExecutionRequest, db: Session = Depends(get_db)):
    """从上次执行恢复"""
    session_service = SessionService(db)
    context = session_service.get_session_context(request.session_id)
    
    if not context:
        raise HTTPException(status_code=404, detail=f"Session {request.session_id} not found")
    
    # 获取最后一步执行
    executions = context.get("executions", [])
    if not executions:
        raise HTTPException(status_code=400, detail="No executions found in session")
    
    last_execution = executions[-1]
    
    # 确定下一个 Agent
    next_agent = request.next_agent
    if not next_agent:
        # 自动推断下一步
        if last_execution["agent_name"] == "product_thinker":
            next_agent = "strategy_planner"
        else:
            return {
                "status": "success",
                "data": {
                    "message": "工作流已完成",
                    "session_id": request.session_id,
                    "last_execution": last_execution
                }
            }
    
    # 获取上一个输出作为下一个输入
    last_output = last_execution.get("output_result", "")
    
    # 执行下一个 Agent
    agent = agent_registry.get_agent(next_agent)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {next_agent} not found")
    
    # 记录执行
    step_index = last_execution["step_index"] + 1
    execution = session_service.record_execution(
        session_id=request.session_id,
        agent_name=next_agent,
        user_input=f"基于上一步结果: {last_output[:100]}...",
        step_index=step_index,
        status='running'
    )
    
    start_time = time.time()
    
    try:
        result = await agent.execute({"user_idea": last_output})
        
        execution_time = int((time.time() - start_time) * 1000)
        output_type = 'implementation_plan' if 'implementation_plan' in result else 'design_document'
        output_result = result.get('implementation_plan') or result.get('design_document', '')
        
        session_service.update_execution(
            execution_id=execution.id,
            status='completed',
            output_result=output_result,
            output_type=output_type,
            used_fallback=result.get('used_fallback', False),
            execution_time=execution_time
        )
        
        result['session_id'] = request.session_id
        result['step_index'] = step_index
        
        return {"status": "success", "data": result}
        
    except Exception as e:
        session_service.update_execution(
            execution_id=execution.id,
            status='error',
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))