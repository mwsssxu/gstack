"""
质量专家 Agent - 多 Agent 协作指挥中心
负责质量测试和评估
"""

from agents.base_agent import BaseAgent
from typing import Dict, Any, List, Optional
from services.llm_service import LLMService
from core.message_bus import AgentMessage, MessageType, message_bus
import logging
import json

logger = logging.getLogger(__name__)


class QualityExpertAgent(BaseAgent):
    """
    质量专家 Agent
    
    职责：质量测试和评估
    
    四层测试模式：
    1. 快速模式：30秒烟雾测试
    2. 标准模式：5-15分钟系统探索
    3. 穷尽模式：深度测试所有问题
    4. 回归模式：变更影响分析
    """
    
    def __init__(self):
        super().__init__(
            name="quality_expert",
            description="质量专家 - 测试和质量评估",
            capabilities=[
                "测试计划生成",
                "边界条件分析",
                "回归测试设计",
                "性能评估",
                "质量门禁检查"
            ],
            # 工作流配置
            outputs_to=['release_expert'],
            inputs_from=['paranoid_expert'],
            feedback_to="paranoid_expert"
        )
        self.llm = LLMService()
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行质量检查任务"""
        target_doc = context.get("design_document") or context.get("implementation_plan")
        doc_type = "design_document" if context.get("design_document") else "implementation_plan"
        test_mode = context.get("test_mode", "standard")  # quick/standard/exhaustive/regression
        
        if not target_doc:
            return self._create_error_result("没有可测试的文档")
        
        logger.info(f"质量专家开始 {test_mode} 模式测试...")
        
        # 生成测试计划
        test_plan = await self._generate_test_plan(target_doc, test_mode)
        
        # 执行测试用例生成
        test_cases = await self._generate_test_cases(target_doc, test_mode)
        
        # 边界条件分析
        boundary_cases = await self._analyze_boundary_conditions(target_doc)
        
        # 质量评估
        quality_metrics = await self._evaluate_quality(target_doc, test_cases)
        
        # 计算质量分数
        quality_score = self._calculate_quality_score(quality_metrics)
        
        # 生成质量报告
        quality_report = self._generate_quality_report(
            test_plan, test_cases, boundary_cases, quality_metrics, quality_score
        )
        
        # 发送质量报告消息
        await message_bus.send(AgentMessage(
            type=MessageType.QUALITY_REPORT,
            sender=self.name,
            subject=f"质量报告 - {doc_type}",
            content={
                "quality_score": quality_score,
                "test_cases_count": len(test_cases),
                "passed": quality_score >= 70
            },
            session_id=context.get("session_id")
        ))
        
        return {
            "agent_name": self.name,
            "status": "completed",
            "quality_report": quality_report,
            "test_plan": test_plan,
            "test_cases": test_cases,
            "boundary_cases": boundary_cases,
            "quality_metrics": quality_metrics,
            "quality_score": quality_score,
            "passed": quality_score >= 70,
            "test_mode": test_mode
        }
    
    async def _generate_test_plan(self, content: str, mode: str) -> Dict[str, Any]:
        """生成测试计划"""
        mode_descriptions = {
            "quick": "快速烟雾测试，30秒内完成，验证核心功能可用",
            "standard": "标准测试，5-15分钟，覆盖主要功能和边界条件",
            "exhaustive": "穷尽测试，深度测试所有场景和边界条件",
            "regression": "回归测试，分析变更影响并验证相关功能"
        }
        
        prompt = f"""作为质量专家，请为以下文档生成测试计划。

测试模式：{mode} - {mode_descriptions.get(mode, '')}

文档内容：
{content[:3000]}

请以JSON格式返回测试计划：
{{
    "test_strategy": "测试策略描述",
    "test_areas": [
        {{
            "area": "测试区域",
            "priority": "high/medium/low",
            "test_types": ["功能测试", "性能测试"],
            "estimated_time": "预估时间"
        }}
    ],
    "test_priorities": ["优先测试项列表"],
    "risks": ["潜在风险"],
    "dependencies": ["测试依赖"]
}}
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            return self._parse_json(result)
        except Exception as e:
            logger.error(f"测试计划生成失败: {e}")
            return {"test_strategy": "基础测试", "test_areas": [], "test_priorities": []}
    
    async def _generate_test_cases(self, content: str, mode: str) -> List[Dict]:
        """生成测试用例"""
        case_count = {
            "quick": 5,
            "standard": 15,
            "exhaustive": 30,
            "regression": 10
        }.get(mode, 10)
        
        prompt = f"""作为质量专家，请为以下文档生成 {case_count} 个测试用例。

测试模式：{mode}

文档内容：
{content[:3000]}

请以JSON格式返回测试用例：
{{
    "test_cases": [
        {{
            "id": "TC001",
            "name": "测试用例名称",
            "type": "positive/negative/boundary",
            "priority": "high/medium/low",
            "preconditions": "前置条件",
            "steps": ["步骤1", "步骤2"],
            "expected_result": "预期结果",
            "actual_result": "待填写"
        }}
    ]
}}
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            parsed = self._parse_json(result)
            return parsed.get("test_cases", [])
        except Exception as e:
            logger.error(f"测试用例生成失败: {e}")
            return []
    
    async def _analyze_boundary_conditions(self, content: str) -> List[Dict]:
        """分析边界条件"""
        prompt = f"""作为质量专家，请分析以下文档中的边界条件。

文档内容：
{content[:3000]}

请以JSON格式返回边界条件分析：
{{
    "boundary_conditions": [
        {{
            "parameter": "参数名",
            "type": "数据类型",
            "min_value": "最小值",
            "max_value": "最大值",
            "edge_cases": ["边界情况"],
            "test_values": ["测试值"]
        }}
    ],
    "edge_cases": [
        {{
            "scenario": "边界场景",
            "description": "场景描述",
            "expected_behavior": "预期行为"
        }}
    ]
}}
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            parsed = self._parse_json(result)
            return parsed.get("boundary_conditions", [])
        except Exception as e:
            logger.error(f"边界条件分析失败: {e}")
            return []
    
    async def _evaluate_quality(self, content: str, test_cases: List[Dict]) -> Dict[str, Any]:
        """评估质量"""
        metrics = {
            "completeness": 0,
            "correctness": 0,
            "robustness": 0,
            "maintainability": 0,
            "performance": 0
        }
        
        prompt = f"""作为质量专家，请评估以下文档的质量。

评估维度：
1. 完整性 (0-100)：功能是否完整，是否有遗漏
2. 正确性 (0-100)：逻辑是否正确，是否有错误
3. 健壮性 (0-100)：错误处理是否完善，边界条件是否覆盖
4. 可维护性 (0-100)：代码结构是否清晰，是否易于维护
5. 性能 (0-100)：是否有性能问题，是否需要优化

文档内容：
{content[:3000]}

请以JSON格式返回质量评估：
{{
    "metrics": {{
        "completeness": 85,
        "correctness": 90,
        "robustness": 75,
        "maintainability": 80,
        "performance": 70
    }},
    "strengths": ["优点列表"],
    "weaknesses": ["不足列表"],
    "recommendations": ["改进建议"]
}}
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            parsed = self._parse_json(result)
            return parsed
        except Exception as e:
            logger.error(f"质量评估失败: {e}")
            return metrics
    
    def _calculate_quality_score(self, metrics: Dict[str, Any]) -> int:
        """计算质量分数"""
        if isinstance(metrics, dict) and "metrics" in metrics:
            m = metrics["metrics"]
            weights = {
                "completeness": 0.25,
                "correctness": 0.30,
                "robustness": 0.20,
                "maintainability": 0.15,
                "performance": 0.10
            }
            
            total = 0
            for key, weight in weights.items():
                total += m.get(key, 0) * weight
            
            return int(total)
        
        return 60
    
    def _generate_quality_report(
        self, 
        test_plan: Dict, 
        test_cases: List[Dict], 
        boundary_cases: List[Dict],
        quality_metrics: Dict,
        quality_score: int
    ) -> str:
        """生成质量报告"""
        report = f"""# 质量专家测试报告

## 质量分数：{quality_score}/100

## 测试策略
{test_plan.get('test_strategy', '未定义')}

## 测试覆盖

### 测试区域
"""
        for area in test_plan.get("test_areas", [])[:5]:
            report += f"- **{area.get('area', '未知')}** (优先级: {area.get('priority', 'medium')})\n"
        
        report += f"""
### 测试用例统计
- 总用例数：{len(test_cases)}
- 高优先级：{sum(1 for tc in test_cases if tc.get('priority') == 'high')}
- 正向测试：{sum(1 for tc in test_cases if tc.get('type') == 'positive')}
- 负向测试：{sum(1 for tc in test_cases if tc.get('type') == 'negative')}
- 边界测试：{sum(1 for tc in test_cases if tc.get('type') == 'boundary')}

## 质量评估
"""
        if isinstance(quality_metrics, dict) and "metrics" in quality_metrics:
            m = quality_metrics["metrics"]
            report += f"""| 维度 | 分数 |
|------|------|
| 完整性 | {m.get('completeness', 0)} |
| 正确性 | {m.get('correctness', 0)} |
| 健壮性 | {m.get('robustness', 0)} |
| 可维护性 | {m.get('maintainability', 0)} |
| 性能 | {m.get('performance', 0)} |
"""
        
        if quality_score >= 80:
            report += "\n## ✅ 质量通过\n本次测试质量良好，可以继续下一阶段。\n"
        elif quality_score >= 70:
            report += "\n## ⚠️ 质量合格\n本次测试质量合格，建议改进不足之处。\n"
        else:
            report += f"\n## ❌ 质量不通过\n质量分数 {quality_score} 低于 70，需要重新修订。\n"
        
        return report
    
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
            "quality_score": 0,
            "passed": False,
            "test_cases": [],
            "quality_metrics": {}
        }