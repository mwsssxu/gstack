"""
WebSocket 广播服务 - 多 Agent 协作指挥中心
管理所有 WebSocket 连接，支持实时状态推送
"""

from fastapi import WebSocket
from typing import List, Dict, Any, Optional
import json
import logging
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket 连接管理器"""
    
    def __init__(self):
        # 活跃连接列表
        self.active_connections: List[WebSocket] = []
        # 按会话ID分组的连接
        self.session_connections: Dict[str, List[WebSocket]] = {}
        # 连接元数据
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: Optional[str] = None):
        """接受新的 WebSocket 连接"""
        await websocket.accept()
        self.active_connections.append(websocket)
        
        # 记录连接元数据
        self.connection_metadata[websocket] = {
            "connected_at": datetime.utcnow().isoformat(),
            "session_id": session_id,
            "last_heartbeat": datetime.utcnow().isoformat()
        }
        
        # 如果指定了会话ID，加入会话组
        if session_id:
            if session_id not in self.session_connections:
                self.session_connections[session_id] = []
            self.session_connections[session_id].append(websocket)
        
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")
        
        # 发送连接成功消息
        await self.send_to_connection(websocket, {
            "type": "connection.established",
            "data": {
                "message": "Connected successfully",
                "connection_count": len(self.active_connections)
            }
        })
    
    def disconnect(self, websocket: WebSocket):
        """断开连接"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        # 从会话组中移除
        metadata = self.connection_metadata.get(websocket, {})
        session_id = metadata.get("session_id")
        if session_id and session_id in self.session_connections:
            if websocket in self.session_connections[session_id]:
                self.session_connections[session_id].remove(websocket)
        
        # 清理元数据
        if websocket in self.connection_metadata:
            del self.connection_metadata[websocket]
        
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")
    
    async def send_to_connection(self, websocket: WebSocket, message: Dict[str, Any]):
        """发送消息到指定连接"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: Dict[str, Any]):
        """广播消息到所有连接"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Broadcast error: {e}")
                disconnected.append(connection)
        
        # 清理断开的连接
        for conn in disconnected:
            self.disconnect(conn)
    
    async def broadcast_to_session(self, session_id: str, message: Dict[str, Any]):
        """广播消息到指定会话的所有连接"""
        if session_id not in self.session_connections:
            return
        
        disconnected = []
        for connection in self.session_connections[session_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Session broadcast error: {e}")
                disconnected.append(connection)
        
        for conn in disconnected:
            self.disconnect(conn)
    
    async def broadcast_agent_status(self, agent_name: str, status: str, details: Optional[Dict] = None):
        """广播 Agent 状态变化"""
        message = {
            "type": "agent.status_changed",
            "data": {
                "agent_name": agent_name,
                "status": status,
                "timestamp": datetime.utcnow().isoformat(),
                "details": details or {}
            }
        }
        await self.broadcast(message)
        logger.info(f"Broadcast agent status: {agent_name} -> {status}")
    
    async def broadcast_task_progress(self, task_id: str, progress: int, message: str = ""):
        """广播任务进度更新"""
        msg = {
            "type": "task.progress",
            "data": {
                "task_id": task_id,
                "progress": progress,
                "message": message,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        await self.broadcast(msg)
    
    async def broadcast_execution_started(self, session_id: str, agent_name: str, step_index: int):
        """广播执行开始事件"""
        message = {
            "type": "execution.started",
            "data": {
                "session_id": session_id,
                "agent_name": agent_name,
                "step_index": step_index,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        await self.broadcast_to_session(session_id, message)
        await self.broadcast(message)  # 也广播到所有连接
    
    async def broadcast_execution_completed(self, session_id: str, agent_name: str, step_index: int, result_summary: str):
        """广播执行完成事件"""
        message = {
            "type": "execution.completed",
            "data": {
                "session_id": session_id,
                "agent_name": agent_name,
                "step_index": step_index,
                "result_summary": result_summary,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        await self.broadcast_to_session(session_id, message)
        await self.broadcast(message)
    
    async def broadcast_execution_error(self, session_id: str, agent_name: str, error_message: str):
        """广播执行错误事件"""
        message = {
            "type": "execution.error",
            "data": {
                "session_id": session_id,
                "agent_name": agent_name,
                "error_message": error_message,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        await self.broadcast_to_session(session_id, message)
        await self.broadcast(message)
    
    def get_connection_count(self) -> int:
        """获取当前连接数"""
        return len(self.active_connections)
    
    def get_session_connection_count(self, session_id: str) -> int:
        """获取指定会话的连接数"""
        return len(self.session_connections.get(session_id, []))


# 全局连接管理器实例
manager = ConnectionManager()