"""
状态管理器 - 多 Agent 协作指挥中心
管理 Agent、工作流和任务的状态
"""

import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from models import get_redis_client

logger = logging.getLogger(__name__)

class StateManager:
    """状态管理器"""
    
    def __init__(self):
        self.redis_client = get_redis_client()
        
    def set_agent_state(self, agent_name: str, state: Dict[str, Any]):
        """设置 Agent 状态"""
        key = f"agent:{agent_name}:state"
        state["updated_at"] = datetime.utcnow().isoformat()
        self.redis_client.setex(key, 3600, json.dumps(state))  # 1小时过期
        
    def get_agent_state(self, agent_name: str) -> Optional[Dict[str, Any]]:
        """获取 Agent 状态"""
        key = f"agent:{agent_name}:state"
        data = self.redis_client.get(key)
        if data:
            return json.loads(data)
        return None
        
    def set_workflow_state(self, workflow_id: str, state: Dict[str, Any]):
        """设置工作流状态"""
        key = f"workflow:{workflow_id}:state"
        state["updated_at"] = datetime.utcnow().isoformat()
        self.redis_client.setex(key, 86400, json.dumps(state))  # 24小时过期
        
    def get_workflow_state(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """获取工作流状态"""
        key = f"workflow:{workflow_id}:state"
        data = self.redis_client.get(key)
        if data:
            return json.loads(data)
        return None
        
    def set_task_progress(self, task_id: str, progress: Dict[str, Any]):
        """设置任务进度"""
        key = f"task:{task_id}:progress"
        progress["updated_at"] = datetime.utcnow().isoformat()
        self.redis_client.setex(key, 3600, json.dumps(progress))  # 1小时过期
        
    def get_task_progress(self, task_id: str) -> Optional[Dict[str, Any]]:
        """获取任务进度"""
        key = f"task:{task_id}:progress"
        data = self.redis_client.get(key)
        if data:
            return json.loads(data)
        return None
        
    def get_all_agent_states(self) -> List[Dict[str, Any]]:
        """获取所有 Agent 状态"""
        keys = self.redis_client.keys("agent:*:state")
        states = []
        for key in keys:
            data = self.redis_client.get(key)
            if data:
                states.append(json.loads(data))
        return states
        
    def get_all_workflow_states(self) -> List[Dict[str, Any]]:
        """获取所有工作流状态"""
        keys = self.redis_client.keys("workflow:*:state")
        states = []
        for key in keys:
            data = self.redis_client.get(key)
            if data:
                states.append(json.loads(data))
        return states