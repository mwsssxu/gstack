"""
会话管理服务 - 多 Agent 协作指挥中心
管理对话历史和执行记录
"""

from sqlalchemy.orm import Session
from models.database import ConversationSession, AgentExecution, ConversationMessage
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)


class SessionService:
    """会话管理服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_session(self, title: Optional[str] = None) -> ConversationSession:
        """创建新会话"""
        session_id = str(uuid.uuid4())[:8]
        session = ConversationSession(
            session_id=session_id,
            title=title or f"会话 {session_id}",
            status='active'
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        logger.info(f"Created new session: {session.session_id}")
        return session
    
    def get_session(self, session_id: str) -> Optional[ConversationSession]:
        """获取会话"""
        return self.db.query(ConversationSession).filter(
            ConversationSession.session_id == session_id
        ).first()
    
    def get_active_session(self) -> Optional[ConversationSession]:
        """获取当前活动会话"""
        return self.db.query(ConversationSession).filter(
            ConversationSession.status == 'active'
        ).order_by(ConversationSession.updated_at.desc()).first()
    
    def get_or_create_session(self, session_id: Optional[str] = None) -> ConversationSession:
        """获取或创建会话
        
        如果提供了 session_id，则获取该会话
        如果没有提供，则创建新会话（不复用活动会话）
        """
        if session_id:
            session = self.get_session(session_id)
            if session:
                return session
        
        # 总是创建新会话，不复用活动会话
        # 这样每次执行都会产生新的对话记录
        return self.create_session()
    
    def list_sessions(self, limit: int = 20) -> List[ConversationSession]:
        """列出所有会话"""
        return self.db.query(ConversationSession).order_by(
            ConversationSession.updated_at.desc()
        ).limit(limit).all()
    
    def pause_session(self, session_id: str) -> Optional[ConversationSession]:
        """暂停会话"""
        session = self.get_session(session_id)
        if session:
            session.status = 'paused'
            self.db.commit()
            self.db.refresh(session)
        return session
    
    def complete_session(self, session_id: str) -> Optional[ConversationSession]:
        """完成会话"""
        session = self.get_session(session_id)
        if session:
            session.status = 'completed'
            self.db.commit()
            self.db.refresh(session)
        return session
    
    def record_execution(
        self,
        session_id: str,
        agent_name: str,
        user_input: str,
        step_index: int = 0,
        output_result: Optional[str] = None,
        output_type: Optional[str] = None,
        status: str = 'pending',
        error_message: Optional[str] = None,
        used_fallback: bool = False,
        execution_time: Optional[int] = None
    ) -> AgentExecution:
        """记录 Agent 执行"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")
        
        execution = AgentExecution(
            session_id=session.id,
            agent_name=agent_name,
            step_index=step_index,
            user_input=user_input,
            output_result=output_result,
            output_type=output_type,
            status=status,
            error_message=error_message,
            used_fallback=used_fallback,
            execution_time=execution_time
        )
        self.db.add(execution)
        
        # 更新会话时间
        session.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(execution)
        logger.info(f"Recorded execution: session={session_id}, agent={agent_name}, status={status}")
        return execution
    
    def update_execution(
        self,
        execution_id: int,
        status: Optional[str] = None,
        output_result: Optional[str] = None,
        output_type: Optional[str] = None,
        error_message: Optional[str] = None,
        used_fallback: Optional[bool] = None,
        execution_time: Optional[int] = None
    ) -> Optional[AgentExecution]:
        """更新执行记录"""
        execution = self.db.query(AgentExecution).filter(
            AgentExecution.id == execution_id
        ).first()
        
        if execution:
            if status:
                execution.status = status
            if output_result is not None:
                execution.output_result = output_result
            if output_type:
                execution.output_type = output_type
            if error_message is not None:
                execution.error_message = error_message
            if used_fallback is not None:
                execution.used_fallback = used_fallback
            if execution_time is not None:
                execution.execution_time = execution_time
            
            if status in ['completed', 'error']:
                execution.completed_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(execution)
        
        return execution
    
    def get_session_executions(self, session_id: str) -> List[AgentExecution]:
        """获取会话的所有执行记录"""
        session = self.get_session(session_id)
        if not session:
            return []
        
        return self.db.query(AgentExecution).filter(
            AgentExecution.session_id == session.id
        ).order_by(AgentExecution.step_index).all()
    
    def get_last_execution(self, session_id: str) -> Optional[AgentExecution]:
        """获取会话的最后执行记录"""
        session = self.get_session(session_id)
        if not session:
            return None
        
        return self.db.query(AgentExecution).filter(
            AgentExecution.session_id == session.id
        ).order_by(AgentExecution.step_index.desc()).first()
    
    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        agent_name: Optional[str] = None
    ) -> ConversationMessage:
        """添加对话消息"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")
        
        message = ConversationMessage(
            session_id=session.id,
            role=role,
            content=content,
            agent_name=agent_name
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message
    
    def get_session_messages(self, session_id: str) -> List[ConversationMessage]:
        """获取会话的所有消息"""
        session = self.get_session(session_id)
        if not session:
            return []
        
        return self.db.query(ConversationMessage).filter(
            ConversationMessage.session_id == session.id
        ).order_by(ConversationMessage.created_at).all()
    
    def get_session_context(self, session_id: str) -> Dict[str, Any]:
        """获取会话上下文（用于恢复执行）"""
        session = self.get_session(session_id)
        if not session:
            return {}
        
        executions = self.get_session_executions(session_id)
        messages = self.get_session_messages(session_id)
        
        # 构建上下文
        context = {
            "session_id": session.session_id,
            "title": session.title,
            "status": session.status,
            "created_at": session.created_at.isoformat() if session.created_at else None,
            "executions": [
                {
                    "agent_name": e.agent_name,
                    "step_index": e.step_index,
                    "status": e.status,
                    "user_input": e.user_input,
                    "output_result": e.output_result,
                    "output_type": e.output_type,
                    "used_fallback": e.used_fallback,
                    "started_at": e.started_at.isoformat() if e.started_at else None,
                    "completed_at": e.completed_at.isoformat() if e.completed_at else None
                }
                for e in executions
            ],
            "messages": [
                {
                    "role": m.role,
                    "content": m.content,
                    "agent_name": m.agent_name,
                    "created_at": m.created_at.isoformat() if m.created_at else None
                }
                for m in messages
            ]
        }
        
        return context
    
    def delete_session(self, session_id: str) -> bool:
        """删除会话"""
        session = self.get_session(session_id)
        if session:
            self.db.delete(session)
            self.db.commit()
            return True
        return False