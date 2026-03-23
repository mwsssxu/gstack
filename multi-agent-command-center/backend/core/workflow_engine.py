"""
工作流引擎 - 多 Agent 协作指挥中心
"""

import logging
from typing import Dict, Any, List
from dataclasses import dataclass
from agents.base_agent import BaseAgent
from core.agent_registry import AgentRegistry
from core.state_manager import StateManager
from core.event_bus import EventBus

@dataclass
class WorkflowStep:
    """工作流步骤定义"""
    agent_name: str
    requires_confirmation: bool = False
    timeout: int = 300  # 5分钟超时

@dataclass
class WorkflowDefinition:
    """工作流定义"""
    id: str
    name: str
    steps: List[WorkflowStep]

class ExecutionContext:
    """执行上下文"""
    def __init__(self, initial_context: Dict[str, Any]):
        self.data = initial_context.copy()
        self.artifacts = {}
    
    def get(self, key: str, default=None):
        return self.data.get(key, default)
    
    def set(self, key: str, value: Any):
        self.data[key] = value
    
    def add_artifact(self, name: str, content: Any):
        self.artifacts[name] = content

logger = logging.getLogger(__name__)

class WorkflowEngine:
    """工作流引擎"""
    
    def __init__(self, agent_registry: AgentRegistry, state_manager: StateManager, event_bus: EventBus):
        self.agent_registry = agent_registry
        self.state_manager = state_manager
        self.event_bus = event_bus
    
    async def execute_workflow(self, workflow_def: WorkflowDefinition, context: ExecutionContext):
        """执行工作流"""
        results = []
        
        for step_index, step in enumerate(workflow_def.steps):
            agent = self.agent_registry.get_agent(step.agent_name)
            if not agent:
                raise ValueError(f"Agent {step.agent_name} not found")
            
            try:
                # 执行 Agent
                result = await agent.execute(context.data)
                results.append(result)
                
                # 更新上下文
                context.data.update(result)
                
                # 处理用户确认（这里简化处理，实际需要事件总线）
                if step.requires_confirmation:
                    # 在实际实现中，这里会暂停并等待用户确认
                    pass
                    
            except Exception as e:
                logger.error(f"Step {step_index} failed: {e}")
                raise
        
        return results