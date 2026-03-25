"""
质量门禁工作流引擎 - 多 Agent 协作指挥中心
实现带有质量检查和审核反馈的工作流
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
from core.agent_registry import AgentRegistry
from core.event_bus import EventBus
from core.message_bus import MessageBus, AgentMessage, MessageType, CollaborationContext
from services.broadcast import manager as ws_manager
import logging
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)


class QualityGateStatus(Enum):
    """质量门禁状态"""
    PENDING = "pending"
    IN_REVIEW = "in_review"
    PASSED = "passed"
    FAILED = "failed"
    NEEDS_REVISION = "needs_revision"


@dataclass
class QualityGate:
    """质量门禁"""
    name: str
    min_score: int
    required_reviews: int = 1
    auto_approve_threshold: int = 90
    

class QualityWorkflowEngine:
    """
    质量门禁工作流引擎
    
    实现完整的质量管理工作流（基于 gstack 方法论）：
    1. 产品思考者 → 设计文档
    2. 架构设计师 → 架构计划
    3. 偏执专家审查 → 审核报告
    4. 质量专家测试 → 质量报告
    5. 反馈循环 → 修订和完善
    6. 发布专家 → 安全发布
    """
    
    def __init__(self, agent_registry: AgentRegistry, event_bus: EventBus):
        self.agent_registry = agent_registry
        self.event_bus = event_bus
        self.message_bus = MessageBus()
        
        # 活跃的协作上下文
        self._contexts: Dict[str, CollaborationContext] = {}
        
        # 质量门禁配置
        self._quality_gates = {
            "design_review": QualityGate(
                name="设计审查",
                min_score=70,
                required_reviews=1,
                auto_approve_threshold=85
            ),
            "quality_check": QualityGate(
                name="质量检查",
                min_score=70,
                required_reviews=1,
                auto_approve_threshold=80
            ),
            "final_approval": QualityGate(
                name="最终批准",
                min_score=75,
                required_reviews=2
            )
        }
        
        # 最大修订次数
        self.max_revisions = 3
    
    async def execute_full_workflow(
        self,
        user_idea: str,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        执行完整工作流（基于 gstack 方法论）
        
        流程：
        1. 产品思考者 → 设计文档
        2. 架构设计师 → 架构计划
        3. 偏执专家审查 → 审核报告
        4. 质量专家测试 → 质量报告
        5. 发布专家 → 安全发布
        """
        # 创建协作上下文
        ctx = CollaborationContext(session_id or datetime.utcnow().strftime("%Y%m%d%H%M%S"))
        self._contexts[ctx.session_id] = ctx
        
        workflow_result = {
            "session_id": ctx.session_id,
            "status": "running",
            "steps": [],
            "final_result": None,
            "revisions": 0,
            "execution_log": []
        }
        
        def log_step(step_name: str, status: str, details: str = ""):
            entry = f"[{datetime.utcnow().isoformat()}] {step_name}: {status} {details}"
            workflow_result["execution_log"].append(entry)
            logger.info(entry)
        
        try:
            # Step 1: 产品思考者
            log_step("产品思考者", "开始", f"输入: {user_idea[:50]}...")
            step_result = await self._execute_step(
                "product_thinker",
                {"user_idea": user_idea, "session_id": ctx.session_id},
                ctx
            )
            workflow_result["steps"].append(step_result)
            log_step("产品思考者", step_result.get("status", "unknown"))
            
            if step_result.get("status") != "completed":
                workflow_result["status"] = "failed"
                return workflow_result
            
            # 保存设计文档
            design_doc = step_result.get("design_document", "")
            ctx.add_document("design_document", {"content": design_doc}, "product_thinker")
            await ws_manager.broadcast_task_progress(ctx.session_id, 15, "设计文档生成完成")
            
            # Step 2: 架构设计师
            log_step("架构设计师", "开始")
            arch_result = await self._execute_step(
                "architect",
                {"design_document": design_doc, "session_id": ctx.session_id},
                ctx
            )
            workflow_result["steps"].append(arch_result)
            log_step("架构设计师", arch_result.get("status", "unknown"))
            
            architecture_plan = arch_result.get("architecture_plan", "")
            ctx.add_document("architecture_plan", {"content": architecture_plan}, "architect")
            await ws_manager.broadcast_task_progress(ctx.session_id, 30, "架构设计完成")
            
            # Step 3: 偏执专家审查（带反馈循环）
            log_step("偏执专家", "开始审查")
            review_passed = False
            revision_count = 0
            
            while not review_passed and revision_count < self.max_revisions:
                review_result = await self._execute_step(
                    "paranoid_expert",
                    {"design_document": design_doc, "session_id": ctx.session_id},
                    ctx
                )
                workflow_result["steps"].append(review_result)
                
                if review_result.get("approved", False):
                    review_passed = True
                    log_step("偏执专家", "通过", f"风险等级: {review_result.get('risk_level', 'unknown')}")
                    ctx.add_review("paranoid_expert", "design_document", 
                                   review_result.get("issues", []), True)
                else:
                    revision_count += 1
                    workflow_result["revisions"] = revision_count
                    log_step("偏执专家", f"需要修订", f"发现 {len(review_result.get('issues', []))} 个问题")
                    
                    # 反馈给产品思考者修订
                    revision_result = await self._request_revision(
                        "product_thinker",
                        design_doc,
                        review_result.get("issues", []),
                        ctx
                    )
                    
                    if revision_result.get("revised_document"):
                        design_doc = revision_result["revised_document"]
                        ctx.add_document("design_document", 
                                        {"content": design_doc, "revision": revision_count},
                                        "product_thinker")
                    
                    await ws_manager.broadcast_task_progress(
                        ctx.session_id, 
                        30 + revision_count * 5,
                        f"修订中 (第{revision_count}次)"
                    )
            
            await ws_manager.broadcast_task_progress(ctx.session_id, 50, "审查完成")
            
            if not review_passed:
                workflow_result["status"] = "failed"
                workflow_result["reason"] = "审查未通过，超过最大修订次数"
                log_step("工作流", "失败", "超过最大修订次数")
                return workflow_result
            
            # Step 4: 质量专家测试
            log_step("质量专家", "开始测试")
            quality_result = await self._execute_step(
                "quality_expert",
                {"design_document": design_doc, "session_id": ctx.session_id, "test_mode": "standard"},
                ctx
            )
            workflow_result["steps"].append(quality_result)
            
            quality_score = quality_result.get("quality_score", 0)
            log_step("质量专家", quality_result.get("status", "unknown"), f"分数: {quality_score}")
            ctx.add_quality_report("quality_expert", quality_result)
            
            await ws_manager.broadcast_task_progress(ctx.session_id, 70, "质量测试完成")
            
            # 检查质量门禁
            gate = self._quality_gates["quality_check"]
            if quality_score < gate.min_score:
                workflow_result["status"] = "failed"
                workflow_result["reason"] = f"质量分数 {quality_score} 低于阈值 {gate.min_score}"
                log_step("工作流", "失败", f"质量分数不足: {quality_score}")
                return workflow_result
            
            # Step 5: 发布专家
            log_step("发布专家", "开始发布准备")
            release_result = await self._execute_step(
                "release_expert",
                {
                    "design_document": design_doc,
                    "architecture_plan": architecture_plan,
                    "quality_score": quality_score,
                    "review_issues": review_result.get("issues", []) if review_result else [],
                    "session_id": ctx.session_id
                },
                ctx
            )
            workflow_result["steps"].append(release_result)
            log_step("发布专家", release_result.get("status", "unknown"), 
                     f"就绪: {release_result.get('is_ready', False)}")
            
            await ws_manager.broadcast_task_progress(ctx.session_id, 90, "发布准备完成")
            
            # 最终汇总
            final_result = {
                "session_id": ctx.session_id,
                "design_document": design_doc,
                "architecture_plan": architecture_plan,
                "quality_score": quality_score,
                "review_issues": review_result.get("issues", []) if review_result else [],
                "test_cases": quality_result.get("test_cases", []),
                "is_ready": release_result.get("is_ready", False),
                "release_report": release_result.get("release_report", ""),
                "revisions": revision_count,
                "completed_at": datetime.utcnow().isoformat()
            }
            
            workflow_result["status"] = "completed" if release_result.get("is_ready") else "completed_with_warnings"
            workflow_result["final_result"] = final_result
            log_step("工作流", "完成", f"状态: {workflow_result['status']}")
            
            await ws_manager.broadcast_task_progress(ctx.session_id, 100, "工作流完成")
            
            return workflow_result
            
        except Exception as e:
            logger.error(f"Workflow execution failed: {e}")
            workflow_result["status"] = "error"
            workflow_result["error"] = str(e)
            return workflow_result
    
    async def _execute_step(
        self,
        agent_name: str,
        context: Dict[str, Any],
        collab_ctx: CollaborationContext
    ) -> Dict[str, Any]:
        """执行单个步骤"""
        agent = self.agent_registry.get_agent(agent_name)
        if not agent:
            return {"status": "error", "error": f"Agent {agent_name} not found"}
        
        logger.info(f"Executing step: {agent_name}")
        
        try:
            result = await agent.execute(context)
            
            # 发送完成消息
            await self.message_bus.send(AgentMessage(
                type=MessageType.TASK_RESULT,
                sender=agent_name,
                subject=f"任务完成",
                content=result,
                session_id=collab_ctx.session_id
            ))
            
            return result
        except Exception as e:
            logger.error(f"Step execution failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def _request_revision(
        self,
        agent_name: str,
        original_content: str,
        issues: List[Dict],
        ctx: CollaborationContext
    ) -> Dict[str, Any]:
        """请求修订"""
        agent = self.agent_registry.get_agent(agent_name)
        if not agent:
            return {"status": "error", "error": f"Agent {agent_name} not found"}
        
        # 构建修订请求
        revision_context = {
            "original_content": original_content,
            "issues": issues,
            "request_type": "revision",
            "session_id": ctx.session_id
        }
        
        # 发送修订请求消息
        await self.message_bus.send(AgentMessage(
            type=MessageType.REVIEW_FEEDBACK,
            sender="workflow_engine",
            receiver=agent_name,
            subject="请修订文档",
            content={
                "issues": issues,
                "revision_count": len(ctx.reviews)
            },
            session_id=ctx.session_id,
            requires_reply=True
        ))
        
        try:
            result = await agent.execute({
                "revision_request": True,
                "original_content": original_content,
                "issues_to_fix": issues,
                "session_id": ctx.session_id
            })
            
            return result
        except Exception as e:
            logger.error(f"Revision request failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def get_context(self, session_id: str) -> Optional[CollaborationContext]:
        """获取协作上下文"""
        return self._contexts.get(session_id)
    
    def get_workflow_status(self, session_id: str) -> Dict[str, Any]:
        """获取工作流状态"""
        ctx = self._contexts.get(session_id)
        if not ctx:
            return {"status": "not_found"}
        
        return {
            "session_id": session_id,
            "documents": list(ctx.documents.keys()),
            "reviews_count": len(ctx.reviews),
            "quality_reports_count": len(ctx.quality_reports),
            "needs_revision": ctx.needs_revision()
        }