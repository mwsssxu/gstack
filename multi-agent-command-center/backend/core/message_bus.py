"""
Agent 消息传递系统 - 多 Agent 协作指挥中心
支持 Agent 间异步消息传递和协作
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime
from enum import Enum
import asyncio
import logging
import uuid

logger = logging.getLogger(__name__)


class MessageType(Enum):
    """消息类型"""
    # 任务相关
    TASK_REQUEST = "task_request"           # 请求执行任务
    TASK_RESULT = "task_result"             # 任务结果
    TASK_FEEDBACK = "task_feedback"         # 任务反馈
    
    # 审核相关
    REVIEW_REQUEST = "review_request"       # 请求审核
    REVIEW_RESULT = "review_result"         # 审核结果
    REVIEW_FEEDBACK = "review_feedback"     # 审核反馈
    
    # 质量相关
    QUALITY_CHECK = "quality_check"         # 质量检查
    QUALITY_REPORT = "quality_report"       # 质量报告
    QUALITY_GATE = "quality_gate"           # 质量门禁
    
    # 协作相关
    COLLABORATION_INVITE = "collab_invite"  # 协作邀请
    HANDOFF = "handoff"                     # 工作交接
    STATUS_UPDATE = "status_update"         # 状态更新
    
    # 系统相关
    ERROR = "error"                         # 错误消息
    ACKNOWLEDGE = "acknowledge"             # 确认消息


class MessagePriority(Enum):
    """消息优先级"""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4


@dataclass
class AgentMessage:
    """Agent 消息"""
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    type: MessageType = MessageType.TASK_REQUEST
    priority: MessagePriority = MessagePriority.NORMAL
    
    # 发送者和接收者
    sender: str = ""
    receiver: str = ""  # 空表示广播
    
    # 消息内容
    subject: str = ""
    content: Dict[str, Any] = field(default_factory=dict)
    
    # 关联信息
    session_id: Optional[str] = None
    workflow_id: Optional[str] = None
    parent_message_id: Optional[str] = None
    
    # 元数据
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    
    # 回复要求
    requires_reply: bool = False
    reply_deadline: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value,
            "priority": self.priority.value,
            "sender": self.sender,
            "receiver": self.receiver,
            "subject": self.subject,
            "content": self.content,
            "session_id": self.session_id,
            "workflow_id": self.workflow_id,
            "parent_message_id": self.parent_message_id,
            "created_at": self.created_at.isoformat(),
            "requires_reply": self.requires_reply
        }


class MessageBus:
    """消息总线 - Agent 间通信核心"""
    
    def __init__(self):
        # 消息队列
        self._queues: Dict[str, asyncio.Queue] = {}
        
        # 消息处理器
        self._handlers: Dict[str, Callable] = {}
        
        # 消息历史
        self._history: List[AgentMessage] = []
        
        # 订阅者
        self._subscribers: Dict[str, List[str]] = {}  # topic -> [agent_names]
        
    async def register_agent(self, agent_name: str):
        """注册 Agent"""
        if agent_name not in self._queues:
            self._queues[agent_name] = asyncio.Queue()
            logger.info(f"Agent registered to message bus: {agent_name}")
    
    def subscribe(self, agent_name: str, message_type: MessageType):
        """订阅消息类型"""
        topic = message_type.value
        if topic not in self._subscribers:
            self._subscribers[topic] = []
        if agent_name not in self._subscribers[topic]:
            self._subscribers[topic].append(agent_name)
            logger.info(f"Agent {agent_name} subscribed to {topic}")
    
    async def send(self, message: AgentMessage):
        """发送消息"""
        # 记录历史
        self._history.append(message)
        
        # 广播消息
        if not message.receiver:
            await self._broadcast(message)
        else:
            # 定向发送
            await self._deliver(message)
    
    async def _deliver(self, message: AgentMessage):
        """投递消息到指定 Agent"""
        receiver = message.receiver
        if receiver in self._queues:
            await self._queues[receiver].put(message)
            logger.info(f"Message delivered: {message.sender} -> {receiver} [{message.type.value}]")
        else:
            logger.warning(f"Receiver not found: {receiver}")
    
    async def _broadcast(self, message: AgentMessage):
        """广播消息"""
        topic = message.type.value
        subscribers = self._subscribers.get(topic, [])
        
        for agent_name in subscribers:
            if agent_name != message.sender and agent_name in self._queues:
                await self._queues[agent_name].put(message)
        
        logger.info(f"Message broadcast: {message.sender} -> {subscribers} [{message.type.value}]")
    
    async def receive(self, agent_name: str, timeout: float = 1.0) -> Optional[AgentMessage]:
        """接收消息"""
        if agent_name not in self._queues:
            return None
        
        try:
            message = await asyncio.wait_for(
                self._queues[agent_name].get(),
                timeout=timeout
            )
            return message
        except asyncio.TimeoutError:
            return None
    
    def get_history(self, agent_name: Optional[str] = None, limit: int = 50) -> List[AgentMessage]:
        """获取消息历史"""
        if agent_name:
            return [m for m in self._history[-limit:] 
                   if m.sender == agent_name or m.receiver == agent_name]
        return self._history[-limit:]
    
    def get_pending_count(self, agent_name: str) -> int:
        """获取待处理消息数量"""
        if agent_name in self._queues:
            return self._queues[agent_name].qsize()
        return 0


class CollaborationContext:
    """协作上下文 - 存储共享工作状态"""
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        
        # 工作文档
        self.documents: Dict[str, Dict[str, Any]] = {}
        
        # 审核记录
        self.reviews: List[Dict[str, Any]] = []
        
        # 质量报告
        self.quality_reports: List[Dict[str, Any]] = []
        
        # 决策记录
        self.decisions: List[Dict[str, Any]] = []
        
        # 反馈循环
        self.feedback_loop: List[Dict[str, Any]] = []
    
    def add_document(self, doc_type: str, content: Dict[str, Any], author: str):
        """添加工作文档"""
        self.documents[doc_type] = {
            "content": content,
            "author": author,
            "created_at": datetime.utcnow().isoformat(),
            "version": len([d for d in self.documents if d == doc_type]) + 1
        }
    
    def get_document(self, doc_type: str) -> Optional[Dict[str, Any]]:
        """获取文档"""
        return self.documents.get(doc_type)
    
    def add_review(self, reviewer: str, target_doc: str, issues: List[Dict], approved: bool):
        """添加审核记录"""
        self.reviews.append({
            "reviewer": reviewer,
            "target_doc": target_doc,
            "issues": issues,
            "approved": approved,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def add_quality_report(self, agent: str, report: Dict[str, Any]):
        """添加质量报告"""
        self.quality_reports.append({
            "agent": agent,
            "report": report,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def needs_revision(self) -> bool:
        """检查是否需要修订"""
        if not self.reviews:
            return False
        return not self.reviews[-1].get("approved", False)
    
    def get_latest_issues(self) -> List[Dict]:
        """获取最新问题列表"""
        if not self.reviews:
            return []
        return self.reviews[-1].get("issues", [])
    
    def to_dict(self) -> Dict[str, Any]:
        """导出上下文"""
        return {
            "session_id": self.session_id,
            "documents": self.documents,
            "reviews": self.reviews,
            "quality_reports": self.quality_reports,
            "decisions": self.decisions,
            "feedback_count": len(self.feedback_loop)
        }


# 全局消息总线
message_bus = MessageBus()