import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useStore } from '../store';
import { FiPlay, FiLoader, FiCheckCircle, FiAlertCircle, FiArrowRight, FiZap, FiFileText, FiTarget } from 'react-icons/fi';

interface Agent {
  name: string;
  description: string;
  capabilities: string[];
}

interface ExecutionResult {
  agent_name: string;
  status: string;
  design_document?: string;
  implementation_plan?: string;
  artifacts?: Array<{
    name: string;
    type: string;
    content: string;
  }>;
  used_fallback?: boolean;
}

export const AgentExecutor: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('product_thinker');
  const [userIdea, setUserIdea] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNextStep, setShowNextStep] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // 全局状态管理
  const updateAgentState = useStore((state) => state.updateAgent);

  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoadingAgents(true);
      try {
        const data = await api.getAgents();
        console.log('Fetched agents:', data);
        setAgents(data);
      } catch (err) {
        console.error('Failed to fetch agents:', err);
      } finally {
        setIsLoadingAgents(false);
      }
    };
    fetchAgents();
  }, []);

  const handleExecute = async () => {
    console.log('handleExecute called', { selectedAgent, userIdea, isExecuting });
    
    if (!userIdea.trim()) {
      setError('请输入您的想法');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setResult(null);
    setShowNextStep(false);
    
    // 更新 Agent 状态为运行中
    updateAgentState(selectedAgent, { status: 'running' as const });

    try {
      console.log('Calling API with:', { selectedAgent, userIdea, currentSessionId });
      const data = await api.executeAgent(selectedAgent, { 
        user_idea: userIdea,
        session_id: currentSessionId || undefined
      });
      console.log('API response:', data);
      setResult(data);
      
      // 保存会话 ID
      if (data.session_id) {
        setCurrentSessionId(data.session_id);
      }
      
      // 更新 Agent 状态为完成
      updateAgentState(selectedAgent, { status: 'completed' as const });
      
      setTimeout(() => setShowNextStep(true), 500);
    } catch (err: any) {
      console.error('API error:', err);
      setError(err.message || '执行失败');
      
      // 更新 Agent 状态为错误
      updateAgentState(selectedAgent, { status: 'error' as const });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleNextStep = async (nextAgent: string) => {
    if (result?.design_document) {
      setSelectedAgent(nextAgent);
      setShowNextStep(false);
      setResult(null);
      // 保持会话ID以继续执行
    }
  };
  
  // 开始新会话
  const handleNewSession = () => {
    setCurrentSessionId(null);
    setResult(null);
    setError(null);
    setShowNextStep(false);
    setUserIdea('');
    setSelectedAgent('product_thinker');
  };

  const selectedAgentInfo = agents.find(a => a.name === selectedAgent);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      {/* Agent 选择区域 */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-5 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"></div>
          <h3 className="font-semibold text-white">选择 Agent</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {isLoadingAgents ? (
            <div className="col-span-2 text-center py-8 text-white/50">
              <FiLoader className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p>加载 Agent 列表中...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-white/50">
              <p>没有可用的 Agent</p>
            </div>
          ) : (
            agents.map((agent) => (
              <div
                key={agent.name}
                onClick={() => !isExecuting && setSelectedAgent(agent.name)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                  selectedAgent === agent.name
                    ? 'border-blue-400/50 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                } ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${agent.name === 'product_thinker' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                    {agent.name === 'product_thinker' ? (
                      <FiFileText className="w-4 h-4 text-blue-300" />
                    ) : (
                      <FiTarget className="w-4 h-4 text-purple-300" />
                    )}
                  </div>
                  <h4 className="font-semibold text-white">{agent.name === 'product_thinker' ? '产品思考者' : '战略规划师'}</h4>
                </div>
                <p className="text-sm text-white/50 line-clamp-2">{agent.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {agent.capabilities.slice(0, 2).map((cap) => (
                    <span key={cap} className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/50">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* 输入区域 */}
      <div className="p-6 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-5 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full"></div>
          <h3 className="font-semibold text-white">输入您的想法</h3>
        </div>
        <textarea
          value={userIdea}
          onChange={(e) => setUserIdea(e.target.value)}
          placeholder="描述您的产品想法或项目需求..."
          className="w-full px-4 py-3 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white/5 text-white placeholder-white/30 shadow-inner resize-none"
          rows={4}
          disabled={isExecuting}
        />
        <div className="mt-4">
          <button
            onClick={handleExecute}
            disabled={isExecuting || !userIdea.trim()}
            className={`w-full flex items-center justify-center px-6 py-4 rounded-xl font-semibold text-base transition-all duration-300 ${
              isExecuting || !userIdea.trim()
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transform hover:-translate-y-0.5'
            }`}
          >
            {isExecuting ? (
              <>
                <FiLoader className="w-5 h-5 mr-2 animate-spin" />
                正在生成中...
              </>
            ) : (
              <>
                <FiPlay className="w-5 h-5 mr-2" />
                开始生成
              </>
            )}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-6 bg-red-500/10 border-t border-red-500/20 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <FiAlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h4 className="text-red-300 font-medium">执行失败</h4>
              <p className="text-red-400/80 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 执行结果 */}
      {result && (
        <div className="animate-fade-in">
          {/* 成功横幅 */}
          <div className="p-4 bg-gradient-to-r from-emerald-500 to-cyan-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <FiCheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-white">生成成功</span>
              </div>
              {result.used_fallback && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-white/90">使用模拟数据</span>
              )}
            </div>
          </div>
          
          {/* 结果内容 */}
          <div className="p-6 bg-white/5">
            {result.design_document && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-blue-500/20 rounded-lg">
                    <FiFileText className="w-4 h-4 text-blue-300" />
                  </div>
                  <span className="font-medium text-white">设计文档</span>
                </div>
                <pre className="p-4 bg-slate-900/50 rounded-xl text-sm text-white/80 whitespace-pre-wrap overflow-x-auto max-h-80 border border-white/10">
                  {result.design_document}
                </pre>
              </div>
            )}

            {result.implementation_plan && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-purple-500/20 rounded-lg">
                    <FiTarget className="w-4 h-4 text-purple-300" />
                  </div>
                  <span className="font-medium text-white">实施计划</span>
                </div>
                <pre className="p-4 bg-slate-900/50 rounded-xl text-sm text-white/80 whitespace-pre-wrap overflow-x-auto max-h-80 border border-white/10">
                  {result.implementation_plan}
                </pre>
              </div>
            )}
          </div>

          {/* 下一步引导 */}
          {showNextStep && result.design_document && (
            <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-t border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-500/20 rounded-lg">
                  <FiArrowRight className="w-5 h-5 text-blue-300" />
                </div>
                <h4 className="font-semibold text-white">下一步建议</h4>
              </div>
              <p className="text-white/50 text-sm mb-4">
                设计文档已生成，您可以继续以下操作：
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleNextStep('strategy_planner')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-purple-500/20"
                >
                  <FiTarget className="w-4 h-4" />
                  生成实施计划
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.design_document || '');
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all border border-white/10 font-medium"
                >
                  复制文档
                </button>
              </div>
            </div>
          )}
          
          {showNextStep && result.implementation_plan && (
            <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-t border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-green-500/20 rounded-lg">
                  <FiCheckCircle className="w-5 h-5 text-green-300" />
                </div>
                <h4 className="font-semibold text-white">工作流完成</h4>
              </div>
              <p className="text-white/50 text-sm">
                您已获得设计文档和实施计划，可以开始项目开发了。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};