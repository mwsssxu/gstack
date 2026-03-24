"""
LLM 服务 - 多 Agent 协作指挥中心
支持阿里云百炼 (DashScope) 和 OpenAI 兼容 API
"""

import httpx
import logging
from typing import Dict, Any, List, Optional
from config.settings import settings

logger = logging.getLogger(__name__)


class LLMService:
    """LLM 服务类"""
    
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.timeout = 60.0  # 请求超时时间
        
        # 根据 provider 设置配置
        if self.provider == "dashscope":
            self.api_key = settings.DASHSCOPE_API_KEY
            self.base_url = settings.DASHSCOPE_BASE_URL
            self.model = settings.DASHSCOPE_MODEL
        else:  # openai
            self.api_key = settings.OPENAI_API_KEY
            self.base_url = settings.OPENAI_BASE_URL
            self.model = settings.OPENAI_MODEL
        
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """
        调用 LLM Chat API
        
        Args:
            messages: 消息列表，格式: [{"role": "user", "content": "..."}]
            temperature: 温度参数
            max_tokens: 最大 token 数
            
        Returns:
            生成的文本内容
        """
        url = f"{self.base_url}/chat/completions"
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url,
                    headers=self.headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    error_msg = f"LLM API 错误: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    raise Exception(error_msg)
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                return content
                
        except httpx.TimeoutException:
            error_msg = "LLM API 请求超时"
            logger.error(error_msg)
            raise Exception(error_msg)
        except Exception as e:
            logger.error(f"LLM API 调用失败: {e}")
            raise
    
    async def generate_design_document(self, user_idea: str) -> str:
        """
        根据用户想法生成设计文档
        
        Args:
            user_idea: 用户的想法描述
            
        Returns:
            设计文档内容
        """
        system_prompt = """你是一位资深的产品经理和技术架构师。你的任务是根据用户的想法，生成一份详细的设计文档。

设计文档应该包含以下部分：
1. 项目概述 - 简要描述项目目标和价值
2. 用户需求分析 - 分析目标用户和核心需求
3. 功能设计 - 列出主要功能模块
4. 技术方案 - 推荐技术栈和架构
5. 实施路线 - 分阶段开发计划
6. 风险评估 - 可能的风险和应对措施

请用中文回答，内容要专业、详细、可操作。"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"我的想法是：{user_idea}\n\n请帮我生成一份详细的设计文档。"}
        ]
        
        return await self.chat(messages, temperature=0.7, max_tokens=3000)
    
    async def generate_implementation_plan(self, input_text: str) -> str:
        """
        根据设计文档或想法生成实施计划
        
        Args:
            input_text: 设计文档或用户想法
            
        Returns:
            实施计划内容
        """
        system_prompt = """你是一位资深的技术项目经理。你的任务是根据设计文档或项目想法，生成一份详细的实施计划。

实施计划应该包含以下部分：
1. 项目概述 - 简要回顾项目目标
2. 技术架构 - 详细的技术方案
3. 开发阶段 - 分阶段任务分解（包含时间估算）
4. 资源需求 - 人力、技术资源
5. 关键里程碑 - 重要节点
6. 风险管理 - 风险识别和应对
7. 验收标准 - 如何判断完成

请用中文回答，内容要具体、可执行。"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"以下是我的项目信息：\n\n{input_text}\n\n请帮我生成一份详细的实施计划。"}
        ]
        
        return await self.chat(messages, temperature=0.7, max_tokens=3000)


# 全局 LLM 服务实例
llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """获取 LLM 服务实例"""
    global llm_service
    if llm_service is None:
        llm_service = LLMService()
    return llm_service