import React, { useEffect } from 'react';
import { useStore } from '../store';
import { api } from '../services/api';
import { FiActivity, FiClock, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

interface AgentCardProps {
  agent: any; // TODO: Replace with proper type
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running':
      return 'text-blue-500';
    case 'completed':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running':
      return <FiActivity className="w-5 h-5" />;
    case 'completed':
      return <FiCheckCircle className="w-5 h-5" />;
    case 'error':
      return <FiAlertTriangle className="w-5 h-5" />;
    default:
      return <FiClock className="w-5 h-5" />;
  }
};

export const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 border-l-4 border-primary-500">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
        <span className={`flex items-center ${getStatusColor(agent.status)}`}>
          {getStatusIcon(agent.status)}
          <span className="ml-1 capitalize">{agent.status}</span>
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-3">{agent.description}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {agent.capabilities?.map((cap: string) => (
          <span 
            key={cap} 
            className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
          >
            {cap}
          </span>
        ))}
      </div>
      {agent.lastExecutionTime && (
        <p className="text-gray-500 text-xs">
          最后执行: {new Date(agent.lastExecutionTime).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export const AgentList: React.FC = () => {
  const agents = useStore((state) => state.agents);
  const setAgents = useStore((state) => state.setAgents);
  
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agentData = await api.getAgentStates();
        setAgents(agentData);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      }
    };
    
    fetchAgents();
    
    // 每30秒刷新一次
    const interval = setInterval(fetchAgents, 30000);
    return () => clearInterval(interval);
  }, [setAgents]);
  
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Agent 管理
      </h2>
      {agents.length === 0 ? (
        <p className="text-gray-600">暂无 Agent 数据</p>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id || agent.name} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
};