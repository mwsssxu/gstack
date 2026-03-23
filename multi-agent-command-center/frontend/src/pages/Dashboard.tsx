import React, { useEffect } from 'react';
import { AgentList } from '../components/AgentCard';
import { WorkflowList } from '../components/WorkflowGraph';
import { TaskList } from '../components/TaskProgress';
import { useWebSocket } from '../hooks/useWebSocket';

export const Dashboard: React.FC = () => {
  // 初始化 WebSocket 连接
  useWebSocket();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        多 Agent 协作指挥中心
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <WorkflowList />
        </div>
        <div>
          <AgentList />
          <TaskList />
        </div>
      </div>
    </div>
  );
};