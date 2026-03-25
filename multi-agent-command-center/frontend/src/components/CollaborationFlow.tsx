import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface AgentCollab {
  name: string;
  display_name: string;
  responsibility: string;
  inputs_from: string[];
  outputs_to: Array<{ target: string; condition: string; description: string }>;
  feedback_to: string | null;
  quality_gate: any;
}

export const CollaborationFlow: React.FC = () => {
  const [visualization, setVisualization] = useState<string>('');
  const [agents, setAgents] = useState<AgentCollab[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const workflowData = await api.getCollaborationWorkflow();
        setVisualization(workflowData.visualization);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch collaboration workflow:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAgentClick = async (agentName: string) => {
    try {
      const collab = await api.getAgentCollaboration(agentName);
      setSelectedAgent(agentName);
      setAgents(prev => {
        const exists = prev.find(a => a.name === agentName);
        if (exists) return prev;
        return [...prev, collab];
      });
    } catch (error) {
      console.error('Failed to fetch agent collaboration:', error);
    }
  };

  const getConditionLabel = (condition: string): string => {
    const labels: Record<string, string> = {
      'on_success': '成功时',
      'on_failure': '失败时',
      'on_approved': '审核通过',
      'on_rejected': '审核不通过',
      'on_quality_pass': '质量通过',
      'always': '总是'
    };
    return labels[condition] || condition;
  };

  const getConditionColor = (condition: string): string => {
    const colors: Record<string, string> = {
      'on_success': 'text-green-600 bg-green-50',
      'on_failure': 'text-red-600 bg-red-50',
      'on_approved': 'text-blue-600 bg-blue-50',
      'on_rejected': 'text-orange-600 bg-orange-50',
      'on_quality_pass': 'text-purple-600 bg-purple-50',
      'always': 'text-gray-600 bg-gray-50'
    };
    return colors[condition] || 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const currentAgent = agents.find(a => a.name === selectedAgent);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Agent 协作工作流
      </h2>

      {/* 工作流可视化 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg overflow-x-auto">
        <pre className="text-xs font-mono whitespace-pre">{visualization}</pre>
      </div>

      {/* Agent 列表 */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">点击查看 Agent 协作配置：</h3>
        <div className="flex flex-wrap gap-2">
          {['product_thinker', 'architect', 'paranoid_expert', 'quality_expert', 'release_expert'].map(name => (
            <button
              key={name}
              onClick={() => handleAgentClick(name)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedAgent === name
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* 选中 Agent 的协作配置 */}
      {currentAgent && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {currentAgent.display_name}
          </h3>
          <p className="text-sm text-gray-600 mb-4">{currentAgent.responsibility}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 输入来源 */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">输入来源</h4>
              <div className="space-y-1">
                {currentAgent.inputs_from.length > 0 ? (
                  currentAgent.inputs_from.map(input => (
                    <span key={input} className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs mr-1">
                      ← {input}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">用户输入</span>
                )}
              </div>
            </div>

            {/* 输出目标 */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">输出目标</h4>
              <div className="space-y-1">
                {currentAgent.outputs_to.map((output, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs">
                    <span className={`px-2 py-0.5 rounded ${getConditionColor(output.condition)}`}>
                      {getConditionLabel(output.condition)}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className="font-medium text-gray-700">{output.target}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 反馈目标 */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">反馈目标</h4>
              {currentAgent.feedback_to ? (
                <span className="inline-flex items-center px-2 py-1 rounded bg-orange-50 text-orange-700 text-xs">
                  ↩ {currentAgent.feedback_to} (修订时)
                </span>
              ) : (
                <span className="text-gray-400 text-xs">无</span>
              )}
            </div>
          </div>

          {/* 质量门禁 */}
          {currentAgent.quality_gate && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">质量门禁</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(currentAgent.quality_gate).map(([key, value]) => (
                  <span key={key} className="inline-flex items-center px-2 py-1 rounded bg-purple-50 text-purple-700 text-xs">
                    {key}: {String(value)}
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