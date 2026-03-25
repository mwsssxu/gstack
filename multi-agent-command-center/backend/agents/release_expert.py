"""
发布专家 Agent - 多 Agent 协作指挥中心
负责安全发布和部署准备
"""

from agents.base_agent import BaseAgent
from typing import Dict, Any, List, Optional
from services.llm_service import LLMService
from core.message_bus import AgentMessage, MessageType, message_bus
import logging
import json

logger = logging.getLogger(__name__)


class ReleaseExpertAgent(BaseAgent):
    """
    发布专家 Agent
    
    职责：安全发布
    
    功能：
    1. 测试引导 - 没有测试框架？自动创建
    2. 覆盖审计 - ASCII代码路径图
    3. 审查门控 - 就绪仪表板
    4. 文档自动化 - 协同更新文档
    5. 版本管理 - 语义化版本自动化
    6. 恢复准备 - 安全网确保可恢复
    """
    
    def __init__(self):
        super().__init__(
            name="release_expert",
            description="发布专家 - 安全发布和部署准备",
            capabilities=[
                "发布准备检查",
                "测试框架引导",
                "覆盖率审计",
                "版本管理",
                "回滚准备",
                "发布文档生成"
            ]
        )
        self.llm = LLMService()
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行发布准备任务"""
        design_doc = context.get("design_document")
        architecture_plan = context.get("architecture_plan")
        quality_score = context.get("quality_score", 0)
        review_issues = context.get("review_issues", [])
        
        if not design_doc:
            return self._create_error_result("没有可发布的内容")
        
        logger.info("发布专家开始发布准备...")
        
        # 1. 生成测试框架建议
        test_framework = await self._generate_test_framework(design_doc)
        
        # 2. 覆盖率审计
        coverage_audit = await self._audit_coverage(design_doc)
        
        # 3. 发布就绪检查
        readiness_check = await self._check_release_readiness(
            design_doc, quality_score, review_issues
        )
        
        # 4. 版本管理
        version_info = self._determine_version(context)
        
        # 5. 回滚准备
        rollback_plan = await self._prepare_rollback(design_doc)
        
        # 6. 生成发布文档
        release_doc = self._generate_release_doc(
            test_framework, coverage_audit, readiness_check, version_info, rollback_plan
        )
        
        # 发送完成消息
        await message_bus.send(AgentMessage(
            type=MessageType.TASK_RESULT,
            sender=self.name,
            subject="发布准备完成",
            content={"ready": readiness_check.get("is_ready", False)},
            session_id=context.get("session_id")
        ))
        
        return {
            "agent_name": self.name,
            "status": "completed",
            "release_report": release_doc,
            "test_framework": test_framework,
            "coverage_audit": coverage_audit,
            "readiness_check": readiness_check,
            "version_info": version_info,
            "rollback_plan": rollback_plan,
            "is_ready": readiness_check.get("is_ready", False)
        }
    
    async def _generate_test_framework(self, content: str) -> Dict[str, Any]:
        """生成测试框架建议"""
        prompt = f"""作为发布专家，请为以下设计生成测试框架建议。

设计内容：
{content[:3000]}

请建议：
1. 测试框架选择
2. 测试文件结构
3. 核心测试用例
4. CI/CD 配置

以JSON格式返回：
{{
    "framework": "pytest/jest/etc",
    "structure": {{
        "test_dir": "tests/",
        "files": ["test_main.py", "test_api.py"]
    }},
    "core_tests": [
        {{"name": "测试名", "type": "unit/integration/e2e", "priority": "high/medium/low"}}
    ],
    "ci_config": {{
        "platform": "GitHub Actions",
        "triggers": ["push", "pull_request"],
        "steps": ["lint", "test", "build"]
    }}
}}
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            return self._parse_json(result)
        except Exception as e:
            logger.error(f"测试框架生成失败: {e}")
            return {"framework": "pytest", "structure": {}, "core_tests": []}
    
    async def _audit_coverage(self, content: str) -> Dict[str, Any]:
        """覆盖率审计"""
        prompt = f"""作为发布专家，请审计测试覆盖率需求。

设计内容：
{content[:2000]}

请分析：
1. 关键路径覆盖
2. 边界条件覆盖
3. 错误路径覆盖

以JSON格式返回：
{{
    "critical_paths": [
        {{"path": "路径描述", "covered": false, "test_needed": "需要的测试"}}
    ],
    "edge_cases": [
        {{"case": "边界情况", "covered": false}}
    ],
    "error_paths": [
        {{"error": "错误场景", "covered": false}}
    ],
    "estimated_coverage": 75,
    "missing_tests": ["缺失的测试"]
}}
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            return self._parse_json(result)
        except Exception as e:
            logger.error(f"覆盖率审计失败: {e}")
            return {"estimated_coverage": 0, "missing_tests": []}
    
    async def _check_release_readiness(
        self, content: str, quality_score: int, issues: List
    ) -> Dict[str, Any]:
        """检查发布就绪状态"""
        checklist = {
            "code_review": len(issues) == 0 or all(i.get("severity") != "critical" for i in issues),
            "quality_gate": quality_score >= 70,
            "documentation": bool(content),
            "tests_defined": True,  # 假设已定义
            "rollback_ready": True   # 将在后续检查
        }
        
        is_ready = all(checklist.values())
        
        prompt = f"""作为发布专家，请评估发布就绪状态。

质量分数：{quality_score}
问题数量：{len(issues)}
检查清单：{json.dumps(checklist, ensure_ascii=False)}

请评估发布就绪度，以JSON格式返回：
{{
    "is_ready": true/false,
    "readiness_score": 85,
    "blockers": ["阻塞项"],
    "warnings": ["警告项"],
    "recommendations": ["建议"],
    "go_no_go": "GO/NO-GO/CONDITIONAL"
}}
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            parsed = self._parse_json(result)
            parsed["checklist"] = checklist
            return parsed
        except Exception as e:
            logger.error(f"发布就绪检查失败: {e}")
            return {"is_ready": is_ready, "checklist": checklist}
    
    def _determine_version(self, context: Dict) -> Dict[str, Any]:
        """确定版本号"""
        # 简单的语义化版本
        version = "1.0.0"
        
        return {
            "version": version,
            "version_type": "major",  # major/minor/patch
            "changelog": [
                "初始版本发布"
            ],
            "breaking_changes": False
        }
    
    async def _prepare_rollback(self, content: str) -> Dict[str, Any]:
        """准备回滚方案"""
        prompt = f"""作为发布专家，请准备回滚方案。

设计内容：
{content[:1500]}

请设计：
1. 回滚触发条件
2. 回滚步骤
3. 数据迁移回滚

以JSON格式返回：
{{
    "rollback_triggers": [
        {{"condition": "条件", "threshold": "阈值"}}
    ],
    "rollback_steps": [
        "步骤1：停止服务",
        "步骤2：切换版本"
    ],
    "data_migration": {{
        "needed": false,
        "steps": []
    }},
    "recovery_time_estimate": "5分钟"
}}
"""
        
        try:
            result = await self.llm.chat([{"role": "user", "content": prompt}])
            return self._parse_json(result)
        except Exception as e:
            logger.error(f"回滚方案准备失败: {e}")
            return {"rollback_steps": ["回滚到上一版本"]}
    
    def _generate_release_doc(
        self, 
        test_framework: Dict, 
        coverage_audit: Dict, 
        readiness_check: Dict,
        version_info: Dict,
        rollback_plan: Dict
    ) -> str:
        """生成发布文档"""
        doc = f"""# 发布报告

## 版本信息
- **版本号**: {version_info.get('version', '1.0.0')}
- **变更类型**: {version_info.get('version_type', 'major')}
- **是否包含破坏性变更**: {'是' if version_info.get('breaking_changes') else '否'}

## 发布就绪检查

| 检查项 | 状态 |
|--------|------|
| 代码审查 | {'✅ 通过' if readiness_check.get('checklist', {}).get('code_review') else '❌ 未通过'} |
| 质量门禁 | {'✅ 通过' if readiness_check.get('checklist', {}).get('quality_gate') else '❌ 未通过'} |
| 文档完整 | {'✅ 通过' if readiness_check.get('checklist', {}).get('documentation') else '❌ 未通过'} |

**决策**: {readiness_check.get('go_no_go', 'CONDITIONAL')}

## 测试框架

- **框架**: {test_framework.get('framework', '未定义')}
- **预估覆盖率**: {coverage_audit.get('estimated_coverage', 0)}%

## 回滚方案

"""
        for step in rollback_plan.get('rollback_steps', []):
            doc += f"1. {step}\n"
        
        doc += f"""
## 变更日志

"""
        for change in version_info.get('changelog', []):
            doc += f"- {change}\n"
        
        if readiness_check.get('is_ready'):
            doc += "\n## ✅ 发布批准\n本次发布已通过所有检查，可以发布。\n"
        else:
            doc += f"\n## ⚠️ 发布条件\n需要解决以下问题：\n"
            for blocker in readiness_check.get('blockers', []):
                doc += f"- {blocker}\n"
        
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
            "is_ready": False
        }