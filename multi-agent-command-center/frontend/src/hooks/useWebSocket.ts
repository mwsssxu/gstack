import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { api } from '../services/api';

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const setWsConnected = useStore((state) => state.setWsConnected);
  const updateAgent = useStore((state) => state.updateAgent);
  const updateWorkflow = useStore((state) => state.updateWorkflow);
  const addTask = useStore((state) => state.addTask);

  useEffect(() => {
    // 创建 WebSocket 连接
    const ws = api.createWebSocket();
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // 处理不同类型的事件
        switch (data.type) {
          case 'agent.updated':
            updateAgent(data.agent.id, data.agent);
            break;
          case 'workflow.updated':
            updateWorkflow(data.workflow.id, data.workflow);
            break;
          case 'task.created':
            addTask(data.task);
            break;
          default:
            console.log('Unknown event type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      
      // 尝试重连
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          // 重新挂载组件会触发新的连接
        }
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [setWsConnected, updateAgent, updateWorkflow, addTask]);
};