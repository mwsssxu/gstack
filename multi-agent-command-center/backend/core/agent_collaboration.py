"""
Agent 协作配置 - 定义 Agent 之间的交互关系
基于 gstack 技能体系
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set
from enum import Enum


class HandoffCondition(Enum):
    """交接条件"""
    ALWAYS = "always"              # 总是交接
    ON_SUCCESS = "on_success"      # 成功时交接
    ON_FAILURE = "on_failure"      # 失败时交接
    ON_APPROVED = "on_approved"    # 审核通过时
    ON_REJECTED = "on_rejected"    # 审核不通过时
    ON_QUALITY_PASS = "quality_pass"  # 质量通过时
    MANUAL = "manual"              # 手动触发


@dataclass
class AgentHandoff:
    """Agent 交接配置"""
    target_agent: str              # 目标 Agent
    condition: HandoffCondition    # 交接条件
    feedback_agent: Optional[str] = None  # 反馈给谁（修订时）
    message_type: str = "handoff"  # 消息类型
    description: str = ""          # 描述


@dataclass
class AgentCollaborationConfig:
    """Agent 协作配置"""
    # Agent 名称
    name: str
    
    # 显示名称
    display_name: str
    
    # 职责描述
    responsibility: str
    
    # 输入来源（谁可以发消息给我）
    inputs_from: List[str] = field(default_factory=list)
    
    # 输出目标（我完成后交给谁）
    outputs_to: List[AgentHandoff] = field(default_factory=list)
    
    # 反馈目标（修订时反馈给谁）
    feedback_to: Optional[str] = None
    
    # 可选的协作 Agent
    collaborators: List[str] = field(default_factory=list)
    
    # 质量门禁（需要达到什么条件才能交接）
    quality_gate: Optional[Dict] = None


# ============== Gstack 标准协作配置 ==============

GSTACK_AGENT_CONFIGS: Dict[str, AgentCollaborationConfig] = {
    
    "product_thinker": AgentCollaborationConfig(
        name="product_thinker",
        display_name="产品思考者",
        responsibility="帮助用户问对问题，生成设计文档",
        inputs_from=["user", "paranoid_expert"],  # 用户直接输入，或偏执专家反馈
        outputs_to=[
            AgentHandoff(
                target_agent="strategy_planner",
                condition=HandoffCondition.ON_SUCCESS,
                description="设计文档完成后交给战略规划师"
            )
        ],
        feedback_to=None,  # 是起点，不需要反馈给谁
        collaborators=["strategy_planner", "architect"]
    ),
    
    "strategy_planner": AgentCollaborationConfig(
        name="strategy_planner",
        display_name="战略规划师",
        responsibility="制定详细的实施计划和技术路线图",
        inputs_from=["product_thinker"],
        outputs_to=[
            AgentHandoff(
                target_agent="architect",
                condition=HandoffCondition.ON_SUCCESS,
                description="战略计划完成后交给架构师"
            )
        ],
        collaborators=["product_thinker", "architect"]
    ),
    
    "architect": AgentCollaborationConfig(
        name="architect",
        display_name="架构设计师",
        responsibility="设计系统架构，确保零沉默失败",
        inputs_from=["product_thinker", "strategy_planner"],
        outputs_to=[
            AgentHandoff(
                target_agent="paranoid_expert",
                condition=HandoffCondition.ON_SUCCESS,
                description="架构设计完成后交给偏执专家审查"
            )
        ],
        collaborators=["product_thinker", "quality_expert"]
    ),
    
    "paranoid_expert": AgentCollaborationConfig(
        name="paranoid_expert",
        display_name="偏执专家",
        responsibility="审查工作，发现潜在缺陷和风险",
        inputs_from=["architect", "quality_expert"],
        outputs_to=[
            AgentHandoff(
                target_agent="quality_expert",
                condition=HandoffCondition.ON_APPROVED,
                feedback_agent="product_thinker",
                description="审查通过后交给质量专家测试"
            ),
            AgentHandoff(
                target_agent="product_thinker",
                condition=HandoffCondition.ON_REJECTED,
                description="审查不通过，反馈给产品思考者修订"
            )
        ],
        feedback_to="product_thinker",  # 修订时反馈给产品思考者
        quality_gate={
            "max_issues": 0,
            "no_critical": True
        }
    ),
    
    "quality_expert": AgentCollaborationConfig(
        name="quality_expert",
        display_name="质量专家",
        responsibility="测试和质量评估",
        inputs_from=["paranoid_expert"],
        outputs_to=[
            AgentHandoff(
                target_agent="release_expert",
                condition=HandoffCondition.ON_QUALITY_PASS,
                description="质量测试通过后交给发布专家"
            )
        ],
        quality_gate={
            "min_score": 70
        }
    ),
    
    "release_expert": AgentCollaborationConfig(
        name="release_expert",
        display_name="发布专家",
        responsibility="安全发布和部署准备",
        inputs_from=["quality_expert"],
        outputs_to=[
            AgentHandoff(
                target_agent="user",
                condition=HandoffCondition.ON_SUCCESS,
                description="发布准备完成，通知用户"
            )
        ],
        quality_gate={
            "is_ready": True
        }
    )
}


class AgentCollaborationManager:
    """Agent 协作管理器"""
    
    def __init__(self):
        self.configs = GSTACK_AGENT_CONFIGS.copy()
    
    def get_config(self, agent_name: str) -> Optional[AgentCollaborationConfig]:
        """获取 Agent 配置"""
        return self.configs.get(agent_name)
    
    def get_next_agent(self, agent_name: str, condition: HandoffCondition) -> Optional[str]:
        """获取下一个 Agent"""
        config = self.configs.get(agent_name)
        if not config:
            return None
        
        for handoff in config.outputs_to:
            if handoff.condition == condition:
                return handoff.target_agent
        
        # 默认返回第一个
        if config.outputs_to:
            return config.outputs_to[0].target_agent
        
        return None
    
    def get_feedback_target(self, agent_name: str) -> Optional[str]:
        """获取反馈目标"""
        config = self.configs.get(agent_name)
        if config:
            return config.feedback_to
        return None
    
    def get_workflow_path(self) -> List[Dict]:
        """获取完整工作流路径"""
        path = []
        visited = set()
        
        def traverse(agent_name: str, depth: int = 0):
            if agent_name in visited or depth > 10:
                return
            
            visited.add(agent_name)
            config = self.configs.get(agent_name)
            
            if not config:
                return
            
            node = {
                "agent": agent_name,
                "display_name": config.display_name,
                "responsibility": config.responsibility,
                "next_agents": [],
                "feedback_to": config.feedback_to
            }
            
            for handoff in config.outputs_to:
                node["next_agents"].append({
                    "target": handoff.target_agent,
                    "condition": handoff.condition.value,
                    "description": handoff.description
                })
                traverse(handoff.target_agent, depth + 1)
            
            path.append(node)
        
        # 从产品思考者开始
        traverse("product_thinker")
        
        return path
    
    def visualize_workflow(self) -> str:
        """生成工作流可视化 ASCII 图"""
        lines = [
            "┌─────────────────────────────────────────────────────────────┐",
            "│                 Gstack Agent 协作工作流                      │",
            "└─────────────────────────────────────────────────────────────┘",
            "",
            "    ┌──────────────┐",
            "    │     用户     │",
            "    └──────┬───────┘",
            "           │ 输入想法",
            "           ▼",
            "    ┌──────────────┐",
            "    │  产品思考者  │ ◄─────────────────┐",
            "    └──────┬───────┘                   │",
            "           │ 设计文档                  │ 修订",
            "           ▼                           │",
            "    ┌──────────────┐                   │",
            "    │  架构设计师  │                   │",
            "    └──────┬───────┘                   │",
            "           │ 架构计划                  │",
            "           ▼                           │",
            "    ┌──────────────┐                   │",
            "    │  偏执专家    │ ──(不通过)────────┘",
            "    └──────┬───────┘",
            "           │ 审核通过",
            "           ▼",
            "    ┌──────────────┐",
            "    │  质量专家    │",
            "    └──────┬───────┘",
            "           │ 质量通过 (≥70分)",
            "           ▼",
            "    ┌──────────────┐",
            "    │  发布专家    │",
            "    └──────┬───────┘",
            "           │ 发布就绪",
            "           ▼",
            "    ┌──────────────┐",
            "    │     用户     │",
            "    └──────────────┘",
            "",
            "┌─────────────────────────────────────────────────────────────┐",
            "│  质量门禁:                                                   │",
            "│  • 偏执专家: 无严重问题                                      │",
            "│  • 质量专家: 分数 ≥ 70                                       │",
            "│  • 发布专家: is_ready = True                                 │",
            "└─────────────────────────────────────────────────────────────┘"
        ]
        
        return "\n".join(lines)


# 全局协作管理器
collaboration_manager = AgentCollaborationManager()