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
      return 'text-blue-300 bg-blue-500/20';
    case 'completed':
      return 'text-green-300 bg-green-500/20';
    case 'error':
      return 'text-red-300 bg-red-500/20';
    default:
      return 'text-gray-400 bg-white/10';
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
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all group">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${isProductThinker ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/20' : 'bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg shadow-purple-500/20'}`}>
          {isProductThinker ? (
            <FiZap className="w-5 h-5 text-white" />
          ) : (
            <FiTarget className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white truncate">
              {isProductThinker ? '产品思考者' : '战略规划师'}
            </h3>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(agent.status)}`}>
              {getStatusIcon(agent.status)}
              <span className="capitalize">{agent.status}</span>
            </span>
          </div>
          <p className="text-white/50 text-xs mt-1 line-clamp-2">{agent.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {agent.capabilities?.slice(0, 2).map((cap: string) => (
              <span key={cap} className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/60">
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