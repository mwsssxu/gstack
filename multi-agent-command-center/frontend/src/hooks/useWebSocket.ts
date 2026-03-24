import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from '../store';
import { api } from '../services/api';

interface WebSocketEvent {
  type: string;
  data: any;
  agent?: any;
  task?: any;
  workflow?: any;
}

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const setWsConnected = useStore((state) => state.setWsConnected);
  const updateAgent = useStore((state) => state.updateAgent);
  const updateWorkflow = useStore((state) => state.updateWorkflow);
  const addTask = useStore((state) => state.addTask);
  const updateTask = useStore((state) => state.updateTask);

  // 清理心跳
  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // 启动心跳
  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    heartbeatRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000); // 每30秒发送心跳
  }, [clearHeartbeat]);

  // 连接 WebSocket
  const connect = useCallback(() => {
    const ws = api.createWebSocket();
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
      setIsReconnecting(false);
      reconnectAttemptsRef.current = 0;
      startHeartbeat();
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketEvent = JSON.parse(event.data);
        
        // 处理不同类型的事件
        switch (data.type) {
          case 'connection.established':
            console.log('Connection established:', data.data);
            break;
            
          case 'heartbeat.ack':
            // 心跳响应，无需处理
            break;
            
          case 'agent.status_changed':
            updateAgent(data.data.agent_name, { 
              status: data.data.status,
              lastExecutionTime: data.data.timestamp
            });
            break;
            
          case 'agent.updated':
            updateAgent(data.agent.id, data.agent);
            break;
            
          case 'execution.started':
            updateAgent(data.data.agent_name, { status: 'running' });
            break;
            
          case 'execution.completed':
            updateAgent(data.data.agent_name, { status: 'completed' });
            break;
            
          case 'execution.error':
            updateAgent(data.data.agent_name, { status: 'error' });
            break;
            
          case 'task.progress':
            updateTask(data.data.task_id, {
              progress: data.data.progress
            });
            break;
            
          case 'task.created':
            addTask(data.task);
            break;
            
          case 'workflow.updated':
            updateWorkflow(data.workflow.id, data.workflow);
            break;
            
          default:
            console.log('Unknown event type:', data.type, data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      clearHeartbeat();
      
      // 自动重连
      const maxAttempts = 5;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      
      if (reconnectAttemptsRef.current < maxAttempts) {
        setIsReconnecting(true);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          console.log(`Reconnecting... attempt ${reconnectAttemptsRef.current}`);
          connect();
        }, delay);
      } else {
        setIsReconnecting(false);
        console.log('Max reconnection attempts reached');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [setWsConnected, updateAgent, updateWorkflow, addTask, updateTask, startHeartbeat, clearHeartbeat]);

  useEffect(() => {
    connect();
    
    return () => {
      clearHeartbeat();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, clearHeartbeat]);
  
  return { isReconnecting };
};