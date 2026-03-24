import React, { useEffect, useState } from 'react';
import { api, Session, Execution } from '../services/api';
import { FiClock, FiPlay, FiTrash2, FiChevronRight, FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiLoader } from 'react-icons/fi';

interface SessionHistoryProps {
  currentSessionId?: string;
  onSessionSelect?: (sessionId: string) => void;
  onResumeExecution?: (sessionId: string) => void;
  onNewSession?: () => void;
}

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return date.toLocaleDateString('zh-CN');
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
    case 'running':
      return <FiLoader className="w-3.5 h-3.5 text-cyan-400 animate-spin" />;
    case 'error':
      return <FiAlertTriangle className="w-3.5 h-3.5 text-red-400" />;
    default:
      return <FiClock className="w-3.5 h-3.5 text-white/40" />;
  }
};

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  currentSessionId,
  onSessionSelect,
  onResumeExecution,
  onNewSession
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载会话列表
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await api.listSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  // 加载会话执行记录
  const loadExecutions = async (sessionId: string) => {
    setLoading(true);
    try {
      const data = await api.getSessionExecutions(sessionId);
      setExecutions(data);
    } catch (error) {
      console.error('Failed to load executions:', error);
    } finally {
      setLoading(false);
    }
  };

  // 选择会话
  const handleSelectSession = (sessionId: string) => {
    setSelectedSession(sessionId);
    loadExecutions(sessionId);
    onSessionSelect?.(sessionId);
  };

  // 恢复执行
  const handleResume = async (sessionId: string) => {
    try {
      await api.resumeExecution(sessionId);
      onResumeExecution?.(sessionId);
      loadExecutions(sessionId);
    } catch (error) {
      console.error('Failed to resume:', error);
    }
  };

  // 删除会话
  const handleDelete = async (sessionId: string) => {
    if (!confirm('确定要删除这个会话吗？')) return;
    try {
      await api.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.session_id !== sessionId));
      if (selectedSession === sessionId) {
        setSelectedSession(null);
        setExecutions([]);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      {/* 标题栏 */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiClock className="w-4 h-4 text-purple-300" />
            <h3 className="font-semibold text-white text-sm">会话历史</h3>
          </div>
          <button
            onClick={onNewSession}
            className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white/70 hover:text-white transition-colors"
          >
            <FiRefreshCw className="w-3 h-3" />
            新会话
          </button>
        </div>
      </div>

      <div className="flex min-h-[300px]">
        {/* 左侧会话列表 */}
        <div className="w-1/2 border-r border-white/10 overflow-y-auto max-h-[400px]">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 p-4">
              <FiClock className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">暂无历史会话</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  onClick={() => handleSelectSession(session.session_id)}
                  className={`p-3 cursor-pointer transition-all duration-200 ${
                    selectedSession === session.session_id
                      ? 'bg-purple-500/20 border-l-2 border-purple-400'
                      : 'hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white truncate font-medium">
                      {session.title || `会话 ${session.session_id.slice(0, 8)}`}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${
                      session.status === 'active' ? 'bg-green-400' :
                      session.status === 'completed' ? 'bg-blue-400' : 'bg-gray-400'
                    }`}></span>
                  </div>
                  <p className="text-xs text-white/40">
                    {formatTime(session.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧执行记录 */}
        <div className="w-1/2 overflow-y-auto max-h-[400px] p-3">
          {!selectedSession ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40">
              <FiChevronRight className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">选择会话查看详情</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <FiLoader className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">执行记录</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleResume(selectedSession)}
                    className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 rounded text-xs text-cyan-300 transition-colors"
                  >
                    <FiPlay className="w-3 h-3" />
                    继续
                  </button>
                  <button
                    onClick={() => handleDelete(selectedSession)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-xs text-red-300 transition-colors"
                  >
                    <FiTrash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {executions.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-4">无执行记录</p>
              ) : (
                executions.map((exec) => (
                  <div
                    key={exec.id}
                    className="p-2.5 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(exec.status)}
                        <span className="text-sm text-white">
                          {exec.agent_name === 'product_thinker' ? '产品思考者' : 
                           exec.agent_name === 'strategy_planner' ? '战略规划师' : exec.agent_name}
                        </span>
                      </div>
                      {exec.execution_time && (
                        <span className="text-xs text-white/40">
                          {(exec.execution_time / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 truncate">
                      {exec.user_input}
                    </p>
                    {exec.output_result && (
                      <p className="text-xs text-white/30 truncate mt-1">
                        → {exec.output_result.slice(0, 50)}...
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionHistory;