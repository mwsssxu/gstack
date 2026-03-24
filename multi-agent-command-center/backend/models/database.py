"""
数据库模型 - 多 Agent 协作指挥中心
支持 SQLite、PostgreSQL 和 MongoDB
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import json

Base = declarative_base()

class Agent(Base):
    """Agent 注册信息"""
    __tablename__ = 'agents'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=False)
    capabilities = Column(JSON, nullable=False)  # JSON array of capabilities
    config = Column(JSON, nullable=False)        # Agent configuration
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class Workflow(Base):
    """工作流定义"""
    __tablename__ = 'workflows'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    definition = Column(JSON, nullable=False)    # Workflow steps definition
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class WorkflowExecution(Base):
    """工作流执行记录"""
    __tablename__ = 'workflow_executions'
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey('workflows.id'), nullable=False)
    status = Column(String(50), default='running')  # running, completed, failed, paused
    current_step = Column(Integer, default=0)
    context = Column(JSON, nullable=False)          # Execution context
    results = Column(JSON, nullable=True)           # Execution results
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    workflow = relationship("Workflow")

class Artifact(Base):
    """生成的工件"""
    __tablename__ = 'artifacts'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False)       # document, code, image, etc.
    content = Column(Text, nullable=False)
    meta_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    workflow_execution_id = Column(Integer, ForeignKey('workflow_executions.id'), nullable=True)
    
    execution = relationship("WorkflowExecution")

class UserDecision(Base):
    """用户决策记录"""
    __tablename__ = 'user_decisions'
    
    id = Column(Integer, primary_key=True, index=True)
    workflow_execution_id = Column(Integer, ForeignKey('workflow_executions.id'), nullable=False)
    step_index = Column(Integer, nullable=False)
    decision = Column(String(50), nullable=False)   # approve, reject, modify
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    execution = relationship("WorkflowExecution")

class SystemLog(Base):
    """系统日志"""
    __tablename__ = 'logs'
    
    id = Column(Integer, primary_key=True, index=True)
    level = Column(String(20), nullable=False)      # info, warning, error
    message = Column(Text, nullable=False)
    source = Column(String(100), nullable=False)    # agent_name or system component
    context = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ConversationSession(Base):
    """对话会话记录"""
    __tablename__ = 'conversation_sessions'
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=True)           # 会话标题
    status = Column(String(50), default='active')        # active, completed, paused
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联执行记录
    executions = relationship("AgentExecution", back_populates="session", cascade="all, delete-orphan")


class AgentExecution(Base):
    """Agent 执行记录"""
    __tablename__ = 'agent_executions'
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('conversation_sessions.id'), nullable=False)
    agent_name = Column(String(100), nullable=False)
    step_index = Column(Integer, default=0)              # 在会话中的步骤序号
    status = Column(String(50), default='pending')       # pending, running, completed, error
    
    # 输入输出
    user_input = Column(Text, nullable=False)            # 用户输入的想法
    output_result = Column(Text, nullable=True)          # Agent 输出结果
    output_type = Column(String(50), nullable=True)      # design_document, implementation_plan, etc.
    
    # 元数据
    error_message = Column(Text, nullable=True)          # 错误信息
    used_fallback = Column(Boolean, default=False)      # 是否使用了模拟响应
    execution_time = Column(Integer, nullable=True)      # 执行时长(毫秒)
    
    # 时间戳
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # 关联
    session = relationship("ConversationSession", back_populates="executions")


class ConversationMessage(Base):
    """对话消息记录"""
    __tablename__ = 'conversation_messages'
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('conversation_sessions.id'), nullable=False)
    role = Column(String(20), nullable=False)            # user, assistant, system
    content = Column(Text, nullable=False)
    agent_name = Column(String(100), nullable=True)      # 关联的 Agent
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关联
    session = relationship("ConversationSession")