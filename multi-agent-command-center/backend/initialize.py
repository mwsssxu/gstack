"""
初始化脚本 - 多 Agent 协作指挥中心
注册基础 Agent 并初始化系统
"""

import asyncio
from agents.product_thinker import ProductThinkerAgent
from core.agent_registry import AgentRegistry
from models import init_db

async def initialize_system():
    """初始化系统"""
    # 初始化数据库
    init_db()
    
    # 创建 Agent 注册中心
    registry = AgentRegistry()
    
    # 注册基础 Agent
    product_thinker = ProductThinkerAgent()
    registry.register_agent(product_thinker, {
        "enabled": True,
        "priority": 1,
        "max_concurrent": 1
    })
    
    print("系统初始化完成！")
    print(f"已注册 {len(registry.list_agents())} 个 Agent")
    
    return registry

if __name__ == "__main__":
    asyncio.run(initialize_system())