import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FiPlay, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

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
}

export const AgentExecutor: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('product_thinker');
  const [userIdea, setUserIdea] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    try {
      const data = await api.executeAgent(selectedAgent, { user_idea: userIdea });
      setResult(data);
    } catch (err: any) {
      setError(err.message || '执行失败');
    } finally {
      setIsExecuting(false);
    }
  };

  const selectedAgentInfo = agents.find(a => a.name === selectedAgent);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        执行 Agent
      </h2>
      
      {/* Agent 选择器 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择 Agent
        </label>
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isExecuting}
        >
          {agents.map((agent) => (
            <option key={agent.name} value={agent.name}>
              {agent.name} - {agent.description}
            </option>
          ))}
        </select>
        {selectedAgentInfo && (
          <p className="mt-1 text-sm text-gray-500">
            能力: {selectedAgentInfo.capabilities.join(', ')}
          </p>
        )}
      </div>
      
      {/* 输入区域 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          您的想法
        </label>
        <textarea
          value={userIdea}
          onChange={(e) => setUserIdea(e.target.value)}
          placeholder="例如：我想做一个智能日程管理应用..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          disabled={isExecuting}
        />
      </div>

      {/* 执行按钮 */}
      <button
        onClick={handleExecute}
        disabled={isExecuting || !userIdea.trim()}
        className={`flex items-center justify-center px-4 py-2 rounded-md text-white font-medium transition-colors ${
          isExecuting || !userIdea.trim()
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isExecuting ? (
          <>
            <FiLoader className="w-5 h-5 mr-2 animate-spin" />
            执行中...
          </>
        ) : (
          <>
            <FiPlay className="w-5 h-5 mr-2" />
            执行 {selectedAgentInfo?.name || selectedAgent}
          </>
        )}
      </button>

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
          <FiAlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
          <div>
            <h4 className="text-red-800 font-medium">执行失败</h4>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* 执行结果 */}
      {result && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center mb-3">
            <FiCheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <h4 className="text-green-800 font-medium">执行成功</h4>
          </div>
          
          {result.design_document && (
            <div className="mt-3">
              <h5 className="text-sm font-medium text-gray-700 mb-2">设计文档</h5>
              <pre className="bg-white p-3 rounded border text-sm overflow-x-auto whitespace-pre-wrap">
                {result.design_document}
              </pre>
            </div>
          )}

          {result.implementation_plan && (
            <div className="mt-3">
              <h5 className="text-sm font-medium text-gray-700 mb-2">实施计划</h5>
              <pre className="bg-white p-3 rounded border text-sm overflow-x-auto whitespace-pre-wrap">
                {result.implementation_plan}
              </pre>
            </div>
          )}

          {result.artifacts && result.artifacts.length > 0 && (
            <div className="mt-3">
              <h5 className="text-sm font-medium text-gray-700 mb-2">生成的工件</h5>
              <div className="flex flex-wrap gap-2">
                {result.artifacts.map((artifact, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white border rounded text-xs text-gray-600"
                  >
                    {artifact.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};