import React, { useEffect } from 'react';
import { useStore } from '../store';
import { api } from '../services/api';
import { FiActivity, FiClock, FiCheckCircle, FiAlertTriangle, FiZap, FiTarget, FiCpu } from 'react-icons/fi';

interface AgentCardProps {
  agent: any;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running':
      return 'text-blue-500 bg-blue-50';
    case 'completed':
      return 'text-green-500 bg-green-50';
    case 'error':
      return 'text-red-500 bg-red-50';
    default:
      return 'text-gray-500 bg-gray-50';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running':
      return <FiActivity className="w-4 h-4 animate-pulse" />;
    case 'completed':
      return <FiCheckCircle className="w-4 h-4" />;
    case 'error':
      return <FiAlertTriangle className="w-4 h-4" />;
    default:
      return <FiClock className="w-4 h-4" />;
  }
};

export const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const isProductThinker = agent.name === 'product_thinker';
  
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isProductThinker ? 'bg-blue-100' : 'bg-purple-100'}`}>
          {isProductThinker ? (
            <FiZap className="w-5 h-5 text-blue-500" />
          ) : (
            <FiTarget className="w-5 h-5 text-purple-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 truncate">
              {isProductThinker ? '产品思考者' : '战略规划师'}
            </h3>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(agent.status)}`}>
              {getStatusIcon(agent.status)}
              <span className="capitalize">{agent.status}</span>
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1 line-clamp-2">{agent.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {agent.capabilities?.slice(0, 2).map((cap: string) => (
              <span key={cap} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
                {cap}
              </span>
            ))}
          </div>
        </div>
      </div>
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
    const interval = setInterval(fetchAgents, 30000);
    return () => clearInterval(interval);
  }, [setAgents]);
  
  return (
    <div className="space-y-3">
      {agents.length === 0 ? (
        <div className="text-center py-6 text-slate-400">
          <FiCpu className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">加载中...</p>
        </div>
      ) : (
        agents.map((agent) => (
          <AgentCard key={agent.id || agent.name} agent={agent} />
        ))
      )}
    </div>
  );
};