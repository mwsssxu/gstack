"""
产品思考者 Agent - 多 Agent 协作指挥中心
负责帮助用户问对问题，生成设计文档
"""

from typing import Dict, Any
import logging
from agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class ProductThinkerAgent(BaseAgent):
    """产品思考者 Agent"""
    
    def __init__(self):
        super().__init__(
            name="product_thinker",
            description="帮助用户问对问题，生成设计文档",
            capabilities=["problem_analysis", "design_document_generation"]
        )
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行产品思考者的主要逻辑
        
        Args:
            context: 包含用户输入想法的上下文
            
        Returns:
            包含设计文档的结果
        """
        self.status = "running"
        try:
            user_idea = context.get("user_idea", "")
            
            if not user_idea:
                raise ValueError("用户想法不能为空")
            
            # 这里应该调用 LLM API 生成设计文档
            # 为了演示，我们使用模拟响应
            design_document = self._generate_design_document(user_idea)
            
            result = {
                "agent_name": self.name,
                "status": "completed",
                "design_document": design_document,
                "artifacts": [
                    {
                        "name": "design_document.md",
                        "type": "document",
                        "content": design_document
                    }
                ]
            }
            
            logger.info(f"ProductThinker completed for idea: {user_idea[:50]}...")
            return result
            
        except Exception as e:
            logger.error(f"ProductThinker failed: {e}")
            self.status = "error"
            raise
        finally:
            if self.status != "error":
                self.status = "completed"
    
    def _generate_design_document(self, user_idea: str) -> str:
        """生成设计文档（模拟实现）"""
        return f"""# 设计文档

## 用户想法
{user_idea}

## 问题分析
- 核心问题：需要明确用户的真实需求
- 目标用户：待确定
- 业务价值：待评估

## 初步建议
1. 明确目标和范围
2. 进行用户调研
3. 定义成功指标

## 下一步
建议运行战略规划师来制定详细计划。
"""