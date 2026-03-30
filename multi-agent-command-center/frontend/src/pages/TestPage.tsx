import React from 'react';
import { useStore } from '../store';

export const TestPage: React.FC = () => {
  const wsConnected = useStore((state) => state.wsConnected);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">前端测试页面</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">连接状态</h2>
        <div className={`flex items-center ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-3 h-3 rounded-full mr-2 ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>WebSocket 连接: {wsConnected ? '已连接' : '未连接'}</span>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">功能测试</h2>
        <p className="text-gray-600 mb-4">
          如果 WebSocket 连接成功，您应该能在主页面看到实时更新的 Agent 状态、工作流进度和任务信息。
        </p>
        <p className="text-gray-600">
          请确保后端服务正在运行 (http://localhost:8001)。
        </p>
      </div>
    </div>
  );
};