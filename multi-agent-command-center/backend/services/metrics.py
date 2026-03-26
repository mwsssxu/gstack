"""
性能监控服务 - 多 Agent 协作指挥中心
收集和分析系统性能指标
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio
import logging
import time
import json

logger = logging.getLogger(__name__)


@dataclass
class MetricPoint:
    """指标数据点"""
    timestamp: datetime
    value: float
    tags: Dict[str, str] = field(default_factory=dict)


@dataclass
class Alert:
    """告警信息"""
    id: str
    level: str  # info, warning, error, critical
    source: str
    message: str
    timestamp: datetime
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    details: Dict[str, Any] = field(default_factory=dict)


class MetricsCollector:
    """性能指标收集器"""
    
    def __init__(self, retention_minutes: int = 60):
        # 指标存储
        self._metrics: Dict[str, List[MetricPoint]] = defaultdict(list)
        
        # 告警列表
        self._alerts: List[Alert] = []
        
        # 告警规则
        self._alert_rules: Dict[str, Dict] = {}
        
        # 统计缓存
        self._stats_cache: Dict[str, Dict] = {}
        
        # 数据保留时间
        self.retention_minutes = retention_minutes
        
        # 初始化默认告警规则
        self._init_default_rules()
    
    def _init_default_rules(self):
        """初始化默认告警规则"""
        self._alert_rules = {
            "agent_execution_time": {
                "warning_threshold": 30.0,  # 秒
                "error_threshold": 60.0,
                "description": "Agent 执行时间过长"
            },
            "workflow_duration": {
                "warning_threshold": 120.0,  # 秒
                "error_threshold": 300.0,
                "description": "工作流执行时间过长"
            },
            "error_rate": {
                "warning_threshold": 0.1,  # 10%
                "error_threshold": 0.3,    # 30%
                "description": "错误率过高"
            },
            "llm_response_time": {
                "warning_threshold": 5.0,  # 秒
                "error_threshold": 15.0,
                "description": "LLM 响应时间过长"
            },
            "memory_usage": {
                "warning_threshold": 80.0,  # %
                "error_threshold": 95.0,
                "description": "内存使用率过高"
            }
        }
    
    def record_metric(self, name: str, value: float, tags: Dict[str, str] = None):
        """记录指标"""
        point = MetricPoint(
            timestamp=datetime.utcnow(),
            value=value,
            tags=tags or {}
        )
        self._metrics[name].append(point)
        
        # 检查告警规则
        self._check_alert_rules(name, value, tags)
        
        # 清理过期数据
        self._cleanup_old_metrics()
    
    def _check_alert_rules(self, metric_name: str, value: float, tags: Dict[str, str]):
        """检查告警规则"""
        rule = self._alert_rules.get(metric_name)
        if not rule:
            return
        
        level = None
        if value >= rule.get("error_threshold", float("inf")):
            level = "error"
        elif value >= rule.get("warning_threshold", float("inf")):
            level = "warning"
        
        if level:
            alert = Alert(
                id=f"{metric_name}_{int(time.time())}",
                level=level,
                source=metric_name,
                message=f"{rule['description']}: {value:.2f}",
                timestamp=datetime.utcnow(),
                details={"value": value, "tags": tags, "thresholds": {
                    "warning": rule.get("warning_threshold"),
                    "error": rule.get("error_threshold")
                }}
            )
            self._alerts.append(alert)
            logger.warning(f"告警 [{level.upper()}]: {alert.message}")
    
    def _cleanup_old_metrics(self):
        """清理过期指标数据"""
        cutoff = datetime.utcnow() - timedelta(minutes=self.retention_minutes)
        
        for name in self._metrics:
            self._metrics[name] = [
                p for p in self._metrics[name]
                if p.timestamp > cutoff
            ]
    
    def get_metric_stats(self, name: str, minutes: int = 30) -> Dict[str, Any]:
        """获取指标统计"""
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        points = [p for p in self._metrics.get(name, []) if p.timestamp > cutoff]
        
        if not points:
            return {"count": 0, "avg": 0, "min": 0, "max": 0, "latest": 0}
        
        values = [p.value for p in points]
        return {
            "count": len(values),
            "avg": sum(values) / len(values),
            "min": min(values),
            "max": max(values),
            "latest": values[-1] if values else 0,
            "points": [
                {"time": p.timestamp.isoformat(), "value": p.value}
                for p in points[-50:]  # 最近50个点
            ]
        }
    
    def get_active_alerts(self, include_resolved: bool = False) -> List[Dict]:
        """获取活动告警"""
        alerts = self._alerts
        if not include_resolved:
            alerts = [a for a in alerts if not a.resolved]
        
        return [
            {
                "id": a.id,
                "level": a.level,
                "source": a.source,
                "message": a.message,
                "timestamp": a.timestamp.isoformat(),
                "resolved": a.resolved,
                "details": a.details
            }
            for a in sorted(alerts, key=lambda x: x.timestamp, reverse=True)[:50]
        ]
    
    def resolve_alert(self, alert_id: str) -> bool:
        """解决告警"""
        for alert in self._alerts:
            if alert.id == alert_id:
                alert.resolved = True
                alert.resolved_at = datetime.utcnow()
                return True
        return False
    
    def get_system_health(self) -> Dict[str, Any]:
        """获取系统健康状态"""
        # 计算各指标状态
        health_status = "healthy"
        
        # 检查活动告警
        active_alerts = [a for a in self._alerts if not a.resolved]
        critical_count = len([a for a in active_alerts if a.level == "critical"])
        error_count = len([a for a in active_alerts if a.level == "error"])
        warning_count = len([a for a in active_alerts if a.level == "warning"])
        
        if critical_count > 0:
            health_status = "critical"
        elif error_count > 0:
            health_status = "error"
        elif warning_count > 0:
            health_status = "warning"
        
        # 收集系统指标
        return {
            "status": health_status,
            "alerts": {
                "critical": critical_count,
                "error": error_count,
                "warning": warning_count,
                "total": len(active_alerts)
            },
            "metrics": {
                "agent_execution_time": self.get_metric_stats("agent_execution_time", 30),
                "workflow_duration": self.get_metric_stats("workflow_duration", 60),
                "llm_response_time": self.get_metric_stats("llm_response_time", 30),
                "error_rate": self.get_metric_stats("error_rate", 30)
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """获取性能摘要"""
        return {
            "agents": {
                "total_executions": sum(
                    len(self._metrics.get(f"agent_{name}_executions", []))
                    for name in ["product_thinker", "architect", "paranoid_expert", 
                                 "quality_expert", "release_expert", "strategy_planner"]
                ),
                "avg_execution_time": self.get_metric_stats("agent_execution_time", 60)["avg"],
                "success_rate": self._calculate_success_rate()
            },
            "workflows": {
                "total": len(self._metrics.get("workflow_started", [])),
                "completed": len(self._metrics.get("workflow_completed", [])),
                "failed": len(self._metrics.get("workflow_failed", [])),
                "avg_duration": self.get_metric_stats("workflow_duration", 60)["avg"]
            },
            "llm": {
                "total_requests": len(self._metrics.get("llm_request", [])),
                "avg_response_time": self.get_metric_stats("llm_response_time", 30)["avg"],
                "error_rate": self.get_metric_stats("llm_error_rate", 30)["latest"]
            }
        }
    
    def _calculate_success_rate(self) -> float:
        """计算成功率"""
        success = len(self._metrics.get("agent_success", []))
        failures = len(self._metrics.get("agent_failure", []))
        total = success + failures
        
        if total == 0:
            return 100.0
        return (success / total) * 100


# 全局指标收集器
metrics_collector = MetricsCollector()


class PerformanceMonitor:
    """性能监控装饰器和工具"""
    
    @staticmethod
    def track_agent_execution(agent_name: str):
        """装饰器：跟踪 Agent 执行时间"""
        def decorator(func):
            async def wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    execution_time = time.time() - start_time
                    
                    # 记录指标
                    metrics_collector.record_metric(
                        "agent_execution_time",
                        execution_time,
                        {"agent": agent_name}
                    )
                    metrics_collector.record_metric(
                        f"agent_{agent_name}_executions",
                        1
                    )
                    metrics_collector.record_metric(
                        "agent_success",
                        1,
                        {"agent": agent_name}
                    )
                    
                    return result
                except Exception as e:
                    execution_time = time.time() - start_time
                    
                    metrics_collector.record_metric(
                        "agent_execution_time",
                        execution_time,
                        {"agent": agent_name, "status": "error"}
                    )
                    metrics_collector.record_metric(
                        "agent_failure",
                        1,
                        {"agent": agent_name, "error": str(e)}
                    )
                    
                    raise
            return wrapper
        return decorator
    
    @staticmethod
    def track_llm_request():
        """装饰器：跟踪 LLM 请求"""
        def decorator(func):
            async def wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    response_time = time.time() - start_time
                    
                    metrics_collector.record_metric(
                        "llm_response_time",
                        response_time
                    )
                    metrics_collector.record_metric(
                        "llm_request",
                        1
                    )
                    
                    return result
                except Exception as e:
                    response_time = time.time() - start_time
                    
                    metrics_collector.record_metric(
                        "llm_response_time",
                        response_time,
                        {"status": "error"}
                    )
                    metrics_collector.record_metric(
                        "llm_error",
                        1,
                        {"error": str(e)}
                    )
                    
                    raise
            return wrapper
        return decorator