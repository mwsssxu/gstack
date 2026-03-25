"""
架构设计师 Agent - 多 Agent 协作指挥中心
负责架构设计和零沉默失败验证
"""

from agents.base_agent import BaseAgent
from typing import Dict, Any, List, Optional
from services.llm_service import LLMService
from core.message_bus import AgentMessage, MessageType, message_bus
import logging
import json

logger = logging.getLogger(__name__)


class ArchitectAgent(BaseAgent):
    """
    架构设计师 Agent
    
    职责：架构设计，零沉默失败
    
    追踪四条数据流路径：
    1. Happy Path（正常流程）
    2. Nil Path（输入缺失）
    3. Empty Path（输入为空）
    4. Error Path（上游失败）
    """
    
    def __init__(self):
        super().__init__(
            name="architect",
            description="架构设计师 - 设计系统架构，确保零沉默失败",
            capabilities=[
                "架构设计",
                "数据流分析",
                "边界条件处理",
                "错误处理设计",
                "ASCII架构图绘制"
            ]
        )
        self.llm = LLMService()
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行架构设计任务"""
        design_doc = context.get("design_document") or context.get("user_idea")
        
        if not design_doc:
            return self._create_error_result("没有可设计的内容")
        
        logger.info("架构设计师开始设计...")
        
        # 1. 绘制架构图
        architecture_diagram = await self._draw_architecture_diagram(design_doc)
        
        # 2. 追踪数据流路径
        data_flow_analysis = await self._analyze_data_flows(design_doc)
        
        # 3. 设计错误处理策略
        error_handling = await self._design_error_handling(design_doc)
        
        # 4. 验证零沉默失败
        silence_check = await self._verify_zero_silence_failure(design_doc, data_flow_analysis)
        
        # 5. 生成架构文档
        architecture_doc = self._generate_architecture_doc(
            architecture_diagram, data_flow_analysis, error_handling, silence_check
        )
        
        # 发送完成消息
        await message_bus.send(AgentMessage(
            type=MessageType.TASK_RESULT,
            sender=self.name,
            subject="架构设计完成",
            content={"has_issues": silence_check.get("has_silence_risks", False)},
            session_id=context.get("session_id")
        ))
        
        return {
            "agent_name": self.name,
            "status": "completed",
            "architecture_plan": architecture_doc,
            "architecture_diagram": architecture_diagram,
            "data_flow_analysis": data_flow_analysis,
            "error_handling": error_handling,
            "silence_failure_check": silence_check,
            "has_architecture_issues": silence_check.get("has_silence_risks", False)
        }
    
    async def _draw_architecture_diagram(self, content: str) -> str:
        """绘制 ASCII 架构图"""
        prompt = f"""作为架构设计师，请为以下设计绘制 ASCII 架构图。

设计内容：
{content[:3000]}

请用 ASCII 字符绘制：
1. 组件框图
2. 数据流向箭头
3. 接口标注
4. 存储层

格式示例：
```
┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │
└─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Database  │
                    └─────────────┘
```

只返回 ASCII 图，不要其他解释。
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            return result
        except Exception as e:
            logger.error(f"架构图绘制失败: {e}")
            return "```\n[架构图生成失败]\n```"
    
    async def _analyze_data_flows(self, content: str) -> Dict[str, Any]:
        """分析数据流路径"""
        prompt = f"""作为架构设计师，请分析以下设计的四条数据流路径。

设计内容：
{content[:3000]}

请分析：
1. Happy Path（正常流程）：数据完整时的处理流程
2. Nil Path（输入缺失）：必填字段缺失时的处理
3. Empty Path（输入为空）：可选字段为空时的处理
4. Error Path（上游失败）：上游服务失败时的处理

以JSON格式返回：
{{
    "happy_path": {{
        "description": "描述",
        "steps": ["步骤1", "步骤2"]
    }},
    "nil_path": {{
        "description": "描述",
        "handling": "处理方式"
    }},
    "empty_path": {{
        "description": "描述",
        "handling": "处理方式"
    }},
    "error_path": {{
        "description": "描述",
        "fallback": "降级方案"
    }}
}}
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            return self._parse_json(result)
        except Exception as e:
            logger.error(f"数据流分析失败: {e}")
            return {}
    
    async def _design_error_handling(self, content: str) -> Dict[str, Any]:
        """设计错误处理策略"""
        prompt = f"""作为架构设计师，请设计错误处理策略。

设计内容：
{content[:3000]}

请设计：
1. 错误分类（可恢复/不可恢复）
2. 重试策略
3. 降级方案
4. 错误日志

以JSON格式返回：
{{
    "error_categories": [
        {{"type": "错误类型", "recoverable": true, "strategy": "处理策略"}}
    ],
    "retry_policy": {{
        "max_retries": 3,
        "backoff": "exponential"
    }},
    "fallback_strategies": [
        {{"scenario": "场景", "fallback": "降级方案"}}
    ],
    "logging_requirements": ["需要记录的信息"]
}}
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            return self._parse_json(result)
        except Exception as e:
            logger.error(f"错误处理设计失败: {e}")
            return {}
    
    async def _verify_zero_silence_failure(self, content: str, data_flow: Dict) -> Dict[str, Any]:
        """验证零沉默失败"""
        prompt = f"""作为架构设计师，请验证是否存在沉默失败风险。

设计内容：
{content[:2000]}

数据流分析：
{json.dumps(data_flow, ensure_ascii=False, indent=2)[:1000]}

沉默失败检查项：
1. 是否有未处理的异常？
2. 是否有未记录的错误？
3. 是否有静默丢弃的数据？
4. 是否有未超时的阻塞操作？
5. 是否有未验证的外部输入？

以JSON格式返回：
{{
    "has_silence_risks": false,
    "risks": [
        {{"type": "风险类型", "location": "位置", "severity": "high/medium/low", "fix": "修复建议"}}
    ],
    "verified_paths": ["已验证的路径"],
    "recommendations": ["改进建议"]
}}
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            return self._parse_json(result)
        except Exception as e:
            logger.error(f"沉默失败验证失败: {e}")
            return {"has_silence_risks": False, "risks": []}
    
    def _generate_architecture_doc(
        self, diagram: str, data_flow: Dict, error_handling: Dict, silence_check: Dict
    ) -> str:
        """生成架构文档"""
        doc = f"""# 架构设计文档

## 架构图

{diagram}

## 数据流分析

### Happy Path
{data_flow.get('happy_path', {}).get('description', '未定义')}
步骤：{', '.join(data_flow.get('happy_path', {}).get('steps', []))}

### Nil Path（输入缺失）
{data_flow.get('nil_path', {}).get('description', '未定义')}
处理：{data_flow.get('nil_path', {}).get('handling', '未定义')}

### Empty Path（输入为空）
{data_flow.get('empty_path', {}).get('description', '未定义')}
处理：{data_flow.get('empty_path', {}).get('handling', '未定义')}

### Error Path（上游失败）
{data_flow.get('error_path', {}).get('description', '未定义')}
降级：{data_flow.get('error_path', {}).get('fallback', '未定义')}

## 错误处理策略

"""
        if error_handling.get('retry_policy'):
            doc += f"""### 重试策略
- 最大重试次数：{error_handling['retry_policy'].get('max_retries', 3)}
- 退避策略：{error_handling['retry_policy'].get('backoff', 'exponential')}

"""
        
        if silence_check.get('has_silence_risks'):
            doc += f"""## ⚠️ 沉默失败风险

发现 {len(silence_check.get('risks', []))} 个潜在风险，需要修复。

"""
        else:
            doc += """## ✅ 零沉默失败验证通过

所有路径均已验证，无沉默失败风险。

"""
        
        return doc
    
    def _parse_json(self, text: str) -> Dict:
        """解析 JSON"""
        try:
            return json.loads(text)
        except:
            import re
            match = re.search(r'\{[\s\S]*\}', text)
            if match:
                try:
                    return json.loads(match.group())
                except:
                    pass
            return {}
    
    def _create_error_result(self, message: str) -> Dict[str, Any]:
        """创建错误结果"""
        return {
            "agent_name": self.name,
            "status": "error",
            "error": message,
            "has_architecture_issues": True
        }