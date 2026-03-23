"""
Agent 注册中心 - 多 Agent 协作指挥中心
"""

from typing import Dict, Optional, List
from agents.base_agent import BaseAgent

class AgentRegistry:
    """Agent 注册中心"""
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.agent_configs: Dict[str, dict] = {}
    
    def register_agent(self, agent: BaseAgent, config: dict):
        """注册新 Agent"""
        self.agents[agent.name] = agent
        self.agent_configs[agent.name] = config
    
    def unregister_agent(self, agent_name: str):
        """卸载 Agent"""
        if agent_name in self.agents:
            del self.agents[agent_name]
            del self.agent_configs[agent_name]
    
    def get_agent(self, agent_name: str) -> Optional[BaseAgent]:
        """获取 Agent"""
        return self.agents.get(agent_name)
    
    def list_agents(self) -> List[dict]:
        """列出所有 Agent 信息"""
        return [
            {
                "name": name,
                "description": agent.description,
                "capabilities": agent.capabilities,
                "config": self.agent_configs[name]
            }
            for name, agent in self.agents.items()
        ]