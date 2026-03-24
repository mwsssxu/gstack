"""
偏执专家 Agent - 多 Agent 协作指挥中心
负责审查工作，发现潜在缺陷和风险
"""

from agents.base_agent import BaseAgent
from typing import Dict, Any, List, Optional
from services.llm_service import LLMService
from core.message_bus import AgentMessage, MessageType, message_bus
import logging
import json

logger = logging.getLogger(__name__)


class ParanoidExpertAgent(BaseAgent):
    """
    偏执专家 Agent
    
    职责：审查工作，发现潜在缺陷
    
    八大结构性缺陷检查：
    1. 数据安全：N+1查询、缺失索引
    2. 重复操作：双重提交、覆盖写入
    3. AI信任边界：JSON格式错误、幻觉值
    4. 选项完整性：新增选项未处理
    5. 条件副作用：某些分支有副作用，某些没有
    6. 写死数值：硬编码值、字符串比较
    7. 无用代码：未使用代码、过时注释
    8. AI提示问题：提示泄露、信息溢出
    """
    
    def __init__(self):
        super().__init__(
            name="paranoid_expert",
            description="偏执专家 - 审查工作，发现潜在缺陷和风险",
            capabilities=[
                "代码审查",
                "安全检查",
                "风险识别",
                "缺陷发现",
                "AI幻觉检测"
            ]
        )
        self.llm = LLMService()
        
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行审查任务"""
        target_doc = context.get("design_document") or context.get("implementation_plan")
        doc_type = "design_document" if context.get("design_document") else "implementation_plan"
        
        if not target_doc:
            return self._create_error_result("没有可审查的文档")
        
        logger.info(f"偏执专家开始审查 {doc_type}...")
        
        # 执行各项检查
        issues = []
        
        # 1. 结构性缺陷检查
        structural_issues = await self._check_structural_defects(target_doc)
        issues.extend(structural_issues)
        
        # 2. 安全风险检查
        security_issues = await self._check_security_risks(target_doc)
        issues.extend(security_issues)
        
        # 3. AI幻觉检查
        hallucination_issues = await self._check_ai_hallucinations(target_doc)
        issues.extend(hallucination_issues)
        
        # 4. 完整性检查
        completeness_issues = await self._check_completeness(target_doc)
        issues.extend(completeness_issues)
        
        # 计算风险等级
        risk_level = self._calculate_risk_level(issues)
        
        # 生成审查报告
        review_report = self._generate_review_report(issues, risk_level)
        
        # 发送审查结果消息
        await message_bus.send(AgentMessage(
            type=MessageType.REVIEW_RESULT,
            sender=self.name,
            subject=f"审查完成 - {doc_type}",
            content={
                "issues_count": len(issues),
                "risk_level": risk_level,
                "approved": risk_level in ["low", "medium"]
            },
            session_id=context.get("session_id")
        ))
        
        return {
            "agent_name": self.name,
            "status": "completed",
            "review_report": review_report,
            "issues": issues,
            "issues_count": len(issues),
            "risk_level": risk_level,
            "approved": risk_level in ["low", "medium"],
            "structural_defects": structural_issues,
            "security_issues": security_issues,
            "hallucination_issues": hallucination_issues
        }
    
    async def _check_structural_defects(self, content: str) -> List[Dict]:
        """检查结构性缺陷"""
        prompt = f"""作为偏执专家，请检查以下文档中的结构性缺陷。

检查项目：
1. N+1 查询问题
2. 缺失索引
3. 重复操作（双重提交、覆盖写入）
4. 条件分支不一致
5. 硬编码值
6. 未使用的代码

文档内容：
{content[:3000]}

请以JSON格式返回发现的问题：
{{
    "issues": [
        {{
            "type": "缺陷类型",
            "severity": "high/medium/low",
            "location": "位置描述",
            "description": "问题描述",
            "suggestion": "修复建议"
        }}
    ]
}}

如果没有发现问题，返回 {{"issues": []}}
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            parsed = self._parse_json(result)
            return parsed.get("issues", [])
        except Exception as e:
            logger.error(f"结构性检查失败: {e}")
            return []
    
    async def _check_security_risks(self, content: str) -> List[Dict]:
        """检查安全风险"""
        prompt = f"""作为安全审查专家，请检查以下文档中的安全风险。

检查项目：
1. SQL 注入风险
2. XSS 跨站脚本风险
3. 敏感数据泄露
4. 权限控制缺失
5. 输入验证不足

文档内容：
{content[:3000]}

请以JSON格式返回发现的安全问题：
{{
    "issues": [
        {{
            "type": "安全风险类型",
            "severity": "critical/high/medium/low",
            "description": "风险描述",
            "impact": "潜在影响",
            "mitigation": "缓解措施"
        }}
    ]
}}
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            parsed = self._parse_json(result)
            return parsed.get("issues", [])
        except Exception as e:
            logger.error(f"安全检查失败: {e}")
            return []
    
    async def _check_ai_hallucinations(self, content: str) -> List[Dict]:
        """检查 AI 幻觉"""
        prompt = f"""作为 AI 质量专家，请检查以下文档中可能的 AI 幻觉问题。

检查项目：
1. 不存在的 API 或函数调用
2. 过时的依赖版本
3. 虚构的配置项
4. 不合理的数值
5. 逻辑矛盾

文档内容：
{content[:3000]}

请以JSON格式返回发现的问题：
{{
    "issues": [
        {{
            "type": "幻觉类型",
            "severity": "high/medium/low",
            "content": "可疑内容",
            "reason": "怀疑原因",
            "verification": "验证方法"
        }}
    ]
}}
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            parsed = self._parse_json(result)
            return parsed.get("issues", [])
        except Exception as e:
            logger.error(f"幻觉检查失败: {e}")
            return []
    
    async def _check_completeness(self, content: str) -> List[Dict]:
        """检查完整性"""
        prompt = f"""作为完整性检查专家，请检查以下文档是否完整。

检查项目：
1. 是否有未定义的引用
2. 是否有缺失的边界条件处理
3. 是否有未处理的异常情况
4. 是否有遗漏的配置项

文档内容：
{content[:3000]}

请以JSON格式返回发现的问题：
{{
    "issues": [
        {{
            "type": "缺失类型",
            "severity": "medium/low",
            "description": "缺失描述",
            "suggestion": "补充建议"
        }}
    ]
}}
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            parsed = self._parse_json(result)
            return parsed.get("issues", [])
        except Exception as e:
            logger.error(f"完整性检查失败: {e}")
            return []
    
    def _calculate_risk_level(self, issues: List[Dict]) -> str:
        """计算风险等级"""
        if not issues:
            return "low"
        
        severities = [issue.get("severity", "low") for issue in issues]
        
        if "critical" in severities:
            return "critical"
        elif severities.count("high") >= 2:
            return "high"
        elif "high" in severities:
            return "medium"
        elif severities.count("medium") >= 3:
            return "medium"
        else:
            return "low"
    
    def _generate_review_report(self, issues: List[Dict], risk_level: str) -> str:
        """生成审查报告"""
        report = f"""# 偏执专家审查报告

## 风险等级：{risk_level.upper()}

## 问题统计
- 总问题数：{len(issues)}
- 高危问题：{sum(1 for i in issues if i.get('severity') in ['critical', 'high'])}
- 中等问题：{sum(1 for i in issues if i.get('severity') == 'medium')}
- 低危问题：{sum(1 for i in issues if i.get('severity') == 'low')}

## 问题详情

"""
        for i, issue in enumerate(issues, 1):
            report += f"""### 问题 {i}
- **类型**：{issue.get('type', '未知')}
- **严重程度**：{issue.get('severity', 'low')}
- **描述**：{issue.get('description', issue.get('content', '无描述'))}
"""
            if 'suggestion' in issue:
                report += f"- **建议**：{issue['suggestion']}\n"
            if 'mitigation' in issue:
                report += f"- **缓解措施**：{issue['mitigation']}\n"
            report += "\n"
        
        if risk_level in ["low", "medium"]:
            report += "\n## ✅ 审核通过\n本次审查未发现严重问题，可以继续下一阶段。\n"
        else:
            report += f"\n## ⚠️ 需要修订\n发现 {sum(1 for i in issues if i.get('severity') in ['critical', 'high'])} 个高危问题，请修复后重新提交审查。\n"
        
        return report
    
    def _parse_json(self, text: str) -> Dict:
        """解析 JSON"""
        try:
            # 尝试直接解析
            return json.loads(text)
        except:
            # 尝试提取 JSON 块
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
            "issues": [],
            "issues_count": 0,
            "risk_level": "unknown",
            "approved": False
        }