import React, { useEffect } from 'react';
import { useStore } from '../store';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface WorkflowGraphProps {
  workflow: any; // TODO: Replace with proper type
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running':
      return '#3B82F6'; // blue-500
    case 'completed':
      return '#10B981'; // green-500
    case 'failed':
      return '#EF4444'; // red-500
    case 'paused':
      return '#F59E0B'; // amber-500
    default:
      return '#9CA3AF'; // gray-400
  }
};

export const WorkflowGraph: React.FC<WorkflowGraphProps> = ({ workflow }) => {
  const data = [
    {
      name: '总步骤',
      value: workflow.totalSteps,
      status: 'total'
    },
    {
      name: '已完成',
      value: workflow.currentStep,
      status: workflow.status
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
        <span 
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            workflow.status === 'running' ? 'bg-blue-100 text-blue-800' :
            workflow.status === 'completed' ? 'bg-green-100 text-green-800' :
            workflow.status === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}
        >
          {workflow.status === 'running' ? '运行中' :
           workflow.status === 'completed' ? '已完成' :
           workflow.status === 'failed' ? '失败' : '暂停'}
        </span>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>进度: {workflow.progress}%</span>
          <span>{workflow.currentStep}/{workflow.totalSteps} 步骤</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-500 h-2 rounded-full" 
            style={{ width: `${workflow.progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value">
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.status === 'total' ? '#9CA3AF' : getStatusColor(entry.status)} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const WorkflowList: React.FC = () => {
  const workflows = useStore((state) => state.workflows);
  const setWorkflows = useStore((state) => state.setWorkflows);
  
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const workflowData = await api.getWorkflowStates();
        setWorkflows(workflowData);
      } catch (error) {
        console.error('Failed to fetch workflows:', error);
      }
    };
    
    fetchWorkflows();
    
    // 每30秒刷新一次
    const interval = setInterval(fetchWorkflows, 30000);
    return () => clearInterval(interval);
  }, [setWorkflows]);
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        工作流状态
      </h2>
      {workflows.length === 0 ? (
        <p className="text-gray-600">暂无工作流数据</p>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <WorkflowGraph key={workflow.id} workflow={workflow} />
          ))}
        </div>
      )}
    </div>
  );
};