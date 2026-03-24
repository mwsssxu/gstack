import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
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

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await api.getAgents();
        setAgents(data);
      } catch (err) {
        console.error('Failed to fetch agents:', err);
      }
    };
    fetchAgents();
  }, []);

  const handleExecute = async () => {
    if (!userIdea.trim()) {
      setError('请输入您的想法');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setResult(null);
    setShowNextStep(false);

    try {
      const data = await api.executeAgent(selectedAgent, { user_idea: userIdea });
      setResult(data);
      setTimeout(() => setShowNextStep(true), 500);
    } catch (err: any) {
      setError(err.message || '执行失败');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleNextStep = async (nextAgent: string) => {
    if (result?.design_document) {
      setSelectedAgent(nextAgent);
      setShowNextStep(false);
      setResult(null);
    }
  };

  const selectedAgentInfo = agents.find(a => a.name === selectedAgent);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Agent 选择区域 */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
          <h3 className="font-semibold text-slate-800">选择 Agent</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.name}
              onClick={() => !isExecuting && setSelectedAgent(agent.name)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedAgent === agent.name
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow'
              } ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {agent.name === 'product_thinker' ? (
                  <FiFileText className="w-5 h-5 text-blue-500" />
                ) : (
                  <FiTarget className="w-5 h-5 text-purple-500" />
                )}
                <h4 className="font-semibold text-slate-800">{agent.name === 'product_thinker' ? '产品思考者' : '战略规划师'}</h4>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2">{agent.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {agent.capabilities.slice(0, 2).map((cap) => (
                  <span key={cap} className="px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-500">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 输入区域 */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
          <h3 className="font-semibold text-slate-800">输入您的想法</h3>
        </div>
        <textarea
          value={userIdea}
          onChange={(e) => setUserIdea(e.target.value)}
          placeholder="描述您的产品想法或项目需求..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-shadow resize-none"
          rows={4}
          disabled={isExecuting}
        />
        <div className="mt-4">
          <button
            onClick={handleExecute}
            disabled={isExecuting || !userIdea.trim()}
            className={`w-full flex items-center justify-center px-6 py-4 rounded-xl text-white font-semibold text-base transition-all duration-300 ${
              isExecuting || !userIdea.trim()
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
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
        <div className="p-6 bg-red-50 border-t border-red-100 animate-fade-in">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-red-800 font-medium">执行失败</h4>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 执行结果 */}
      {result && (
        <div className="animate-fade-in">
          {/* 成功横幅 */}
          <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5" />
                <span className="font-semibold">生成成功</span>
              </div>
              {result.used_fallback && (
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">使用模拟数据</span>
              )}
            </div>
          </div>
          
          {/* 结果内容 */}
          <div className="p-6">
            {result.design_document && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiFileText className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-slate-800">设计文档</span>
                </div>
                <pre className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 whitespace-pre-wrap overflow-x-auto max-h-80 border border-slate-100">
                  {result.design_document}
                </pre>
              </div>
            )}

            {result.implementation_plan && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiTarget className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-slate-800">实施计划</span>
                </div>
                <pre className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 whitespace-pre-wrap overflow-x-auto max-h-80 border border-slate-100">
                  {result.implementation_plan}
                </pre>
              </div>
            )}
          </div>

          {/* 下一步引导 */}
          {showNextStep && result.design_document && (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <FiArrowRight className="w-5 h-5 text-blue-500" />
                <h4 className="font-semibold text-slate-800">下一步建议</h4>
              </div>
              <p className="text-slate-600 text-sm mb-4">
                设计文档已生成，您可以继续以下操作：
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleNextStep('strategy_planner')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                >
                  <FiTarget className="w-4 h-4" />
                  生成实施计划
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.design_document || '');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 font-medium"
                >
                  复制文档
                </button>
              </div>
            </div>
          )}
          
          {showNextStep && result.implementation_plan && (
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <FiCheckCircle className="w-5 h-5 text-green-500" />
                <h4 className="font-semibold text-slate-800">工作流完成</h4>
              </div>
              <p className="text-slate-600 text-sm">
                您已获得设计文档和实施计划，可以开始项目开发了。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};