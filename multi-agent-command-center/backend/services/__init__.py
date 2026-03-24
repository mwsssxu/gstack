"""
服务模块 - 多 Agent 协作指挥中心
"""

from services.llm_service import LLMService, get_llm_service

__all__ = ["LLMService", "get_llm_service"]