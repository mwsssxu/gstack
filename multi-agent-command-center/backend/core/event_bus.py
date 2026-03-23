"""
事件总线 - 多 Agent 协作指挥中心
使用 Redis Pub/Sub 实现事件发布订阅
"""

import asyncio
import json
import logging
from typing import Dict, Any, Callable, List
from models import get_redis_client

logger = logging.getLogger(__name__)

class EventBus:
    """事件总线"""
    
    def __init__(self):
        self.redis_client = get_redis_client()
        self.subscribers: Dict[str, List[Callable]] = {}
        self.running = False
        
    async def publish(self, event_type: str, data: Dict[str, Any]):
        """发布事件"""
        try:
            event_data = {
                "type": event_type,
                "data": data,
                "timestamp": asyncio.get_event_loop().time()
            }
            message = json.dumps(event_data)
            await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: self.redis_client.publish("events", message)
            )
            logger.debug(f"Published event: {event_type}")
        except Exception as e:
            logger.error(f"Failed to publish event {event_type}: {e}")
    
    async def subscribe(self, event_type: str, callback: Callable):
        """订阅事件"""
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(callback)
        logger.debug(f"Subscribed to event: {event_type}")
        
        # 启动 Redis 订阅监听器
        if not self.running:
            await self._start_listener()
    
    async def _start_listener(self):
        """启动 Redis 订阅监听器"""
        self.running = True
        pubsub = self.redis_client.pubsub()
        pubsub.subscribe("events")
        
        def listen():
            for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        event_data = json.loads(message["data"])
                        event_type = event_data["type"]
                        if event_type in self.subscribers:
                            for callback in self.subscribers[event_type]:
                                asyncio.create_task(callback(event_data["data"]))
                    except Exception as e:
                        logger.error(f"Error processing event: {e}")
        
        # 在单独的线程中运行监听器
        import threading
        listener_thread = threading.Thread(target=listen, daemon=True)
        listener_thread.start()