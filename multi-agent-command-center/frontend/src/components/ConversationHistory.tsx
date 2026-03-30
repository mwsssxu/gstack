import React, { useState, useEffect } from 'react';
import { FiMessageCircle, FiUser, FiCpu, FiChevronDown, FiChevronUp, FiCheckCircle, FiAlertCircle, FiLoader, FiClock } from 'react-icons/fi';
import { api, Session, Execution } from '../services/api';

interface Conversation {
  id: string;
  title: string;
  user_input: string;
  status: 'running' | 'completed' | 'error';
  created_at: string;
  steps: ConversationStep[];
}

interface ConversationStep {
  agent_name: string;
  agent_display_name: string;
  status: 'running' | 'completed' | 'error';
  output?: string;
  execution_time?: number;
}

interface ConversationHistoryProps {
  currentSessionId?: string;
  onConversationUpdate?: (conversation: Conversation) => void;
}

// Agent 名称映射
const AGENT_NAMES: Record<string, string> = {
  product_thinker: '产品思考者',
  strategy_planner: '战略规划师',
  architect: '架构设计师',
  paranoid_expert: '偏执专家',
  quality_expert: '质量专家',
  release_expert: '发布专家',
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <FiCheckCircle className="w-4 h-4 text-emerald-400" />;
    case 'running':
      return <FiLoader className="w-4 h-4 text-cyan-400 animate-spin" />;
    case 'error':
      return <FiAlertCircle className="w-4 h-4 text-red-400" />;
    default:
      return <FiClock className="w-4 h-4 text-white/40" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'border-emerald-500/30 bg-emerald-500/10';
    case 'running':
      return 'border-cyan-500/30 bg-cyan-500/10';
    case 'error':
      return 'border-red-500/30 bg-red-500/10';
    default:
      return 'border-white/10 bg-white/5';
  }
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  currentSessionId,
  onConversationUpdate
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载会话列表
  useEffect(() => {
    loadConversations();
  }, []);

  // 监听新会话
  useEffect(() => {
    if (currentSessionId && !conversations.find(c => c.id === currentSessionId)) {
      loadConversations();
    }
  }, [currentSessionId]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const sessions = await api.listSessions();
      
      // 转换为对话格式
      const convs: Conversation[] = await Promise.all(
        sessions.slice(0, 20).map(async (session) => {
          let executions: Execution[] = [];
          try {
            executions = await api.getSessionExecutions(session.session_id);
          } catch (e) {
            // 忽略错误
          }
          
          const steps: ConversationStep[] = executions.map(exec => ({
            agent_name: exec.agent_name,
            agent_display_name: AGENT_NAMES[exec.agent_name] || exec.agent_name,
            status: exec.status === 'completed' ? 'completed' : exec.status === 'error' ? 'error' : 'running',
            output: exec.output_result?.slice(0, 200),
            execution_time: exec.execution_time
          }));

          // 确定整体状态
          let overallStatus: 'running' | 'completed' | 'error' = 'completed';
          if (steps.some(s => s.status === 'error')) overallStatus = 'error';
          else if (steps.some(s => s.status === 'running')) overallStatus = 'running';

          return {
            id: session.session_id,
            title: session.title || `对话 ${session.session_id.slice(0, 8)}`,
            user_input: executions[0]?.user_input || '无输入',
            status: overallStatus,
            created_at: session.created_at,
            steps
          };
        })
      );
      
      // 按时间排序，最新的在前
      convs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换展开状态
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // 添加新对话（供外部调用）
  const addConversation = (conversation: Conversation) => {
    setConversations(prev => [conversation, ...prev]);
  };

  // 更新对话状态
  const updateConversation = (id: string, updates: Partial<Conversation>) => {
    setConversations(prev => 
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      {/* 标题栏 */}
      <div className="px-5 py-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiMessageCircle className="w-5 h-5 text-indigo-300" />
            <h3 className="font-semibold text-white">对话历史</h3>
            <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/60">
              {conversations.length}
            </span>
          </div>
          <button
            onClick={loadConversations}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="刷新"
          >
            <FiClock className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* 对话列表 */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-white/50">
            <FiLoader className="w-6 h-6 animate-spin mr-2" />
            加载中...
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/40">
            <FiMessageCircle className="w-10 h-10 mb-3 opacity-50" />
            <p>暂无对话记录</p>
            <p className="text-sm mt-1">点击"开始生成"创建新对话</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`transition-all duration-200 ${expandedId === conv.id ? 'bg-white/5' : ''}`}
              >
                {/* 对话卡片头部 */}
                <div
                  onClick={() => toggleExpand(conv.id)}
                  className="px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(conv.status)}
                        <span className="text-sm font-medium text-white truncate">
                          {conv.title}
                        </span>
                      </div>
                      <p className="text-sm text-white/50 truncate">
                        {conv.user_input}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <FiCpu className="w-3 h-3" />
                          {conv.steps.length} 步骤
                        </span>
                        <span>{formatTime(conv.created_at)}</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      {expandedId === conv.id ? (
                        <FiChevronUp className="w-5 h-5 text-white/40" />
                      ) : (
                        <FiChevronDown className="w-5 h-5 text-white/40" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 展开的执行详情 */}
                {expandedId === conv.id && (
                  <div className="px-4 pb-4 animate-fade-in">
                    <div className="space-y-2 ml-2 border-l-2 border-white/10 pl-4">
                      {conv.steps.map((step, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${getStatusColor(step.status)}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(step.status)}
                              <span className="text-sm font-medium text-white">
                                {step.agent_display_name}
                              </span>
                            </div>
                            {step.execution_time && (
                              <span className="text-xs text-white/40">
                                {(step.execution_time / 1000).toFixed(1)}s
                              </span>
                            )}
                          </div>
                          {step.output && (
                            <p className="text-xs text-white/50 mt-1 line-clamp-2">
                              {step.output}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHistory;