"""
LLM 服务 - 多 Agent 协作指挥中心
支持阿里云百炼 (DashScope) 和 OpenAI 兼容 API
"""

import httpx
import logging
import requests  # 添加同步请求库
from typing import Dict, Any, List, Optional
from config.settings import settings
import asyncio

logger = logging.getLogger(__name__)


class LLMService:
    """LLM 服务类"""
    
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.timeout = 120.0  # 增加超时时间
        self.max_retries = 3  # 最大重试次数
        
        # 根据 provider 设置配置
        if self.provider == "dashscope":
            self.api_key = settings.DASHSCOPE_API_KEY
            self.base_url = settings.DASHSCOPE_BASE_URL
            self.model = settings.DASHSCOPE_MODEL
            print(f"[LLM] 使用 DashScope API: {self.base_url}, model: {self.model}")
        else:  # openai
            self.api_key = settings.OPENAI_API_KEY
            self.base_url = settings.OPENAI_BASE_URL
            self.model = settings.OPENAI_MODEL
            print(f"[LLM] 使用 OpenAI API: {self.base_url}, model: {self.model}")
        
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def _chat_sync(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """同步调用 LLM Chat API"""
        url = f"{self.base_url}/chat/completions"
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        print(f"[LLM] 同步请求 URL: {url}")
        print(f"[LLM] 请求 model: {self.model}")
        
        # 禁用代理
        proxies = {
            "http": None,
            "https": None,
        }
        
        response = requests.post(
            url,
            headers=self.headers,
            json=payload,
            timeout=self.timeout,
            proxies=proxies
        )
        
        print(f"[LLM] 响应状态: {response.status_code}")
        
        if response.status_code != 200:
            error_msg = f"LLM API 错误: {response.status_code} - {response.text}"
            print(f"[LLM] {error_msg}")
            raise Exception(error_msg)
        
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        print(f"[LLM] 成功返回 {len(content)} 字符")
        return content
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """
        调用 LLM Chat API（使用同步 requests 库包装为异步）
        """
        last_error = None
        for attempt in range(self.max_retries):
            try:
                print(f"[LLM] 尝试 {attempt + 1}/{self.max_retries}")
                
                # 使用同步 requests 库，在 asyncio 中运行
                loop = asyncio.get_event_loop()
                content = await loop.run_in_executor(
                    None,
                    lambda: self._chat_sync(messages, temperature, max_tokens)
                )
                return content
                
            except requests.exceptions.Timeout as e:
                last_error = f"LLM API 请求超时 (尝试 {attempt + 1}/{self.max_retries})"
                print(f"[LLM] {last_error}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2)
            except requests.exceptions.ConnectionError as e:
                last_error = f"LLM API 连接失败: {e} (尝试 {attempt + 1}/{self.max_retries})"
                print(f"[LLM] {last_error}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2)
            except Exception as e:
                last_error = f"LLM API 调用失败: {type(e).__name__}: {e}"
                print(f"[LLM] {last_error}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2)
        
        raise Exception(last_error or "LLM API 调用失败")
    
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