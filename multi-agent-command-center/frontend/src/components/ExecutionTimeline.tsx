import React from 'react';
import { FiCheckCircle, FiCircle, FiLoader, FiAlertTriangle, FiChevronRight } from 'react-icons/fi';

interface ExecutionStep {
  agent_name: string;
  step_index: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp?: string;
  duration?: number;
}

interface ExecutionTimelineProps {
  steps: ExecutionStep[];
  currentStep?: number;
  onStepClick?: (step: ExecutionStep) => void;
}

const getAgentDisplayName = (agentName: string): string => {
  const names: Record<string, string> = {
    'product_thinker': '产品思考者',
    'strategy_planner': '战略规划师',
    'market_analyst': '市场分析师',
    'tech_architect': '技术架构师'
  };
  return names[agentName] || agentName;
};

const getAgentColor = (agentName: string): string => {
  const colors: Record<string, string> = {
    'product_thinker': 'from-blue-400 to-blue-600',
    'strategy_planner': 'from-purple-400 to-purple-600',
    'market_analyst': 'from-green-400 to-green-600',
    'tech_architect': 'from-orange-400 to-orange-600'
  };
  return colors[agentName] || 'from-gray-400 to-gray-600';
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running':
      return <FiLoader className="w-4 h-4 animate-spin text-cyan-400" />;
    case 'completed':
      return <FiCheckCircle className="w-4 h-4 text-emerald-400" />;
    case 'error':
      return <FiAlertTriangle className="w-4 h-4 text-red-400" />;
    default:
      return <FiCircle className="w-4 h-4 text-white/30" />;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'running':
      return 'border-cyan-400 bg-cyan-400/10';
    case 'completed':
      return 'border-emerald-400 bg-emerald-400/10';
    case 'error':
      return 'border-red-400 bg-red-400/10';
    default:
      return 'border-white/20 bg-white/5';
  }
};

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({ 
  steps, 
  currentStep,
  onStepClick 
}) => {
  if (steps.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        <p className="text-sm">暂无执行记录</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 时间线连接线 */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-white/10"></div>
      
      {/* 步骤列表 */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isActive = currentStep === step.step_index;
          const isLast = index === steps.length - 1;
          
          return (
            <div 
              key={`${step.agent_name}-${step.step_index}`}
              className={`relative pl-12 cursor-pointer group`}
              onClick={() => onStepClick?.(step)}
            >
              {/* 节点 */}
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                isActive ? 'scale-125 shadow-lg shadow-cyan-500/30' : ''
              } ${getStatusColor(step.status)}`}>
                {getStatusIcon(step.status)}
              </div>
              
              {/* 内容卡片 */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${
                isActive 
                  ? 'bg-white/10 border-cyan-400/30 shadow-lg shadow-cyan-500/10' 
                  : 'bg-white/5 border-white/10 group-hover:bg-white/10'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Agent 头像 */}
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getAgentColor(step.agent_name)} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                      {step.step_index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">
                        {getAgentDisplayName(step.agent_name)}
                      </h4>
                      <p className="text-xs text-white/50">
                        步骤 {step.step_index + 1}
                        {step.duration && ` · ${(step.duration / 1000).toFixed(1)}s`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* 状态标签 */}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      step.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                      step.status === 'running' ? 'bg-cyan-500/20 text-cyan-300' :
                      step.status === 'error' ? 'bg-red-500/20 text-red-300' :
                      'bg-white/10 text-white/50'
                    }`}>
                      {step.status === 'completed' ? '已完成' :
                       step.status === 'running' ? '运行中' :
                       step.status === 'error' ? '失败' : '等待中'}
                    </span>
                    
                    {!isLast && (
                      <FiChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/50 transition-colors" />
                    )}
                  </div>
                </div>
                
                {/* 时间戳 */}
                {step.timestamp && (
                  <p className="mt-2 text-xs text-white/30">
                    {new Date(step.timestamp).toLocaleString('zh-CN')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 简化版水平时间线
export const HorizontalTimeline: React.FC<ExecutionTimelineProps> = ({ 
  steps, 
  currentStep 
}) => {
  if (steps.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {steps.map((step, index) => (
        <React.Fragment key={step.step_index}>
          {/* 步骤节点 */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${
            currentStep === step.step_index 
              ? 'bg-cyan-500/20 border-cyan-400/50' 
              : step.status === 'completed'
                ? 'bg-emerald-500/10 border-emerald-400/30'
                : 'bg-white/5 border-white/10'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              step.status === 'completed' ? 'bg-emerald-400' :
              step.status === 'running' ? 'bg-cyan-400 animate-pulse' :
              step.status === 'error' ? 'bg-red-400' : 'bg-white/30'
            }`}></div>
            <span className="text-xs text-white/70 whitespace-nowrap">
              {getAgentDisplayName(step.agent_name)}
            </span>
          </div>
          
          {/* 连接线 */}
          {index < steps.length - 1 && (
            <div className={`w-6 h-0.5 ${
              steps[index + 1]?.status === 'completed' ? 'bg-emerald-500/50' : 'bg-white/10'
            }`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ExecutionTimeline;