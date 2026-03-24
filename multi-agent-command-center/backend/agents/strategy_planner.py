"""
战略规划师 Agent - 多 Agent 协作指挥中心
负责根据设计文档制定详细的实施计划
"""

from typing import Dict, Any
import logging
from agents.base_agent import BaseAgent
from services.llm_service import get_llm_service

logger = logging.getLogger(__name__)

class StrategyPlannerAgent(BaseAgent):
    """战略规划师 Agent"""
    
    def __init__(self):
        super().__init__(
            name="strategy_planner",
            description="根据设计文档制定详细的实施计划和技术路线图",
            capabilities=["plan_generation", "roadmap_creation", "task_breakdown"]
        )
        self.llm = None  # 延迟初始化
    
    def _get_llm(self):
        """获取 LLM 服务实例"""
        if self.llm is None:
            self.llm = get_llm_service()
        return self.llm
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行战略规划师的主要逻辑
        
        Args:
            context: 包含设计文档或用户想法的上下文
            
        Returns:
            包含实施计划的结果
        """
        self.status = "running"
        try:
            design_document = context.get("design_document", "")
            user_idea = context.get("user_idea", "")
            
            if not design_document and not user_idea:
                raise ValueError("设计文档或用户想法不能同时为空")
            
            # 尝试使用 LLM API 生成实施计划
            implementation_plan = None
            llm_error = None
            
            try:
                llm = self._get_llm()
                implementation_plan = await llm.generate_implementation_plan(design_document or user_idea)
                logger.info("使用 LLM API 生成实施计划成功")
            except Exception as e:
                llm_error = str(e)
                logger.warning(f"LLM API 调用失败，使用模拟响应: {e}")
                implementation_plan = self._generate_implementation_plan(design_document or user_idea)
            
            result = {
                "agent_name": self.name,
                "status": "completed",
                "implementation_plan": implementation_plan,
                "artifacts": [
                    {
                        "name": "implementation_plan.md",
                        "type": "document",
                        "content": implementation_plan
                    }
                ]
            }
            
            if llm_error:
                result["llm_error"] = llm_error
                result["used_fallback"] = True
            
            logger.info(f"StrategyPlanner completed for idea: {(design_document or user_idea)[:50]}...")
            return result
            
        except Exception as e:
            logger.error(f"StrategyPlanner failed: {e}")
            self.status = "error"
            raise
        finally:
            if self.status != "error":
                self.status = "completed"
    
    def _generate_implementation_plan(self, input_text: str) -> str:
        """生成实施计划（模拟实现）"""
        return f"""# 实施计划

## 基于输入
{input_text[:200]}...

## 技术方案

### 前端技术栈
- React 18 + TypeScript
- Tailwind CSS
- Zustand 状态管理

### 后端技术栈
- FastAPI (Python)
- SQLAlchemy ORM
- Redis 缓存

### 基础设施
- Docker 容器化
- PostgreSQL 数据库

## 开发阶段

### 第一阶段：基础架构 (Week 1-2)
- [ ] 项目初始化
- [ ] 数据库设计
- [ ] API 框架搭建
- [ ] 基础 UI 组件

### 第二阶段：核心功能 (Week 3-4)
- [ ] 用户认证
- [ ] 主要业务逻辑
- [ ] 前后端集成
- [ ] 单元测试

### 第三阶段：优化完善 (Week 5-6)
- [ ] 性能优化
- [ ] 安全加固
- [ ] 文档完善
- [ ] 部署上线

## 资源需求
- 前端开发 x 1
- 后端开发 x 1
- 产品经理 x 0.5

## 风险评估
- 技术风险：低
- 时间风险：中
- 资源风险：低

## 下一步
建议运行 CodeReviewer 来评审代码结构。
"""