"""
Agent 基类 - 多 Agent 协作指挥中心
支持 Agent 间协作和交接
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """Agent 基类"""
    
    def __init__(
        self, 
        name: str, 
        description: str, 
        capabilities: list,
        # 协作配置
        inputs_from: List[str] = None,
        outputs_to: List[str] = None,
        feedback_to: Optional[str] = None
    ):
        self.name = name
        self.description = description
        self.capabilities = capabilities
        self.status = "idle"
        
        # 协作关系
        self.inputs_from = inputs_from or []   # 谁可以发消息给我
        self.outputs_to = outputs_to or []     # 我完成后交给谁
        self.feedback_to = feedback_to          # 修订时反馈给谁
        
    @abstractmethod
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行 Agent 的主要逻辑
        
        Args:
            context: 执行上下文，包含任务信息、文档等
            
        Returns:
            执行结果字典
        """
        pass
        
    def get_info(self) -> Dict[str, Any]:
        """获取 Agent 信息"""
        # 如果不在运行中，重置为 idle（避免历史错误状态影响显示）
        display_status = self.status if self.status == 'running' else 'idle'
        return {
            "name": self.name,
            "description": self.description,
            "capabilities": self.capabilities,
            "status": display_status,
            # 协作信息
            "collaboration": {
                "inputs_from": self.inputs_from,
                "outputs_to": self.outputs_to,
                "feedback_to": self.feedback_to
            }
        }
    
    def get_next_agent(self, success: bool = True) -> Optional[str]:
        """
        获取下一个要执行的 Agent
        
        Args:
            success: 当前任务是否成功
            
        Returns:
            下一个 Agent 名称，如果没有则返回 None
        """
        if success and self.outputs_to:
            return self.outputs_to[0]
        elif not success and self.feedback_to:
            return self.feedback_to
        return None
    
    def can_receive_from(self, agent_name: str) -> bool:
        """检查是否可以接收来自指定 Agent 的消息"""
        return agent_name in self.inputs_from or agent_name == "user"