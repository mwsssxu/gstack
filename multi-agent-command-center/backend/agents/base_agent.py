"""
Agent 基类 - 多 Agent 协作指挥中心
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """Agent 基类"""
    
    def __init__(self, name: str, description: str, capabilities: list):
        self.name = name
        self.description = description
        self.capabilities = capabilities
        self.status = "idle"
        
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
        return {
            "name": self.name,
            "description": self.description,
            "capabilities": self.capabilities,
            "status": self.status
        }