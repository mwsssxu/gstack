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
    metadata = Column(JSON, nullable=True)
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