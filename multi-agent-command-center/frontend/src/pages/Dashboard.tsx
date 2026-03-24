import React, { useState, useEffect } from 'react';
import { AgentList } from '../components/AgentCard';
import { AgentExecutor } from '../components/AgentExecutor';
import { ExecutionTimeline, HorizontalTimeline } from '../components/ExecutionTimeline';
import { SessionHistory } from '../components/SessionHistory';
import { ProgressBar, CircularProgress } from '../components/ProgressBar';
import { StatsCards, MiniStats, ActivityIndicator } from '../components/StatsCards';
import { useWebSocket } from '../hooks/useWebSocket';
import { useStore } from '../store';
import { FiGithub, FiHeart, FiCpu, FiPlay, FiFileText, FiZap, FiStar, FiTrendingUp, FiWifi, FiWifiOff } from 'react-icons/fi';

export const Dashboard: React.FC = () => {
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const { isReconnecting } = useWebSocket();
  const agents = useStore((state) => state.agents);
  const wsConnected = useStore((state) => state.wsConnected);
  
  // 计算统计数据
  const stats = {
    totalExecutions: agents.reduce((sum, a) => sum + (a.executionCount || 0), 0),
    successRate: agents.length > 0 ? Math.round(agents.filter(a => a.status === 'completed').length / agents.length * 100) : 0,
    avgExecutionTime: 5000, // 可从后端获取
    activeAgents: agents.filter(a => a.status === 'running').length
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* 顶部导航 */}
      <header className="relative bg-slate-900/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-60 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl">
                  <FiZap className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                  多 Agent 协作指挥中心
                </h1>
                <p className="text-sm text-purple-300/80">AI-Powered Intelligent Workflow</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* WebSocket 状态指示器 */}
              <div className="flex items-center gap-2">
                {wsConnected ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-full border border-emerald-400/30">
                    <FiWifi className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-300">实时连接</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-full border border-red-400/30">
                    <FiWifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-300">
                      {isReconnecting ? '重连中...' : '已断开'}
                    </span>
                  </div>
                )}
              </div>
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm text-white/70">系统运行中</span>
              </div>
              <a 
                href="https://github.com/mwsssxu/gstack" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/10"
              >
                <FiGithub className="w-5 h-5" />
                <span className="font-medium">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="relative max-w-7xl mx-auto px-6 py-8">
        {/* 功能区域标题 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <FiStar className="w-5 h-5 text-yellow-400" />
                <FiStar className="w-4 h-4 text-yellow-400/60" />
              </div>
              <h2 className="text-3xl font-bold text-white">工作台</h2>
            </div>
            <p className="text-purple-300/60 ml-8">选择 Agent 并执行任务，查看生成结果</p>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-white/40">
            <FiTrendingUp className="w-5 h-5" />
            <span className="text-sm">实时更新</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧：执行区域 */}
          <div className="lg:col-span-8">
            {/* 步骤指示器 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-50"></div>
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/30">1</div>
                  </div>
                  <span className="text-sm font-medium text-white">选择 Agent</span>
                </div>
                <div className="flex-1 h-1 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-slate-500/30 mx-4 rounded-full"></div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white/40 text-sm font-bold border border-white/10">2</div>
                  <span className="text-sm text-white/40">输入想法</span>
                </div>
                <div className="flex-1 h-1 bg-slate-500/30 mx-4 rounded-full"></div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white/40 text-sm font-bold border border-white/10">3</div>
                  <span className="text-sm text-white/40">查看结果</span>
                </div>
              </div>
            </div>
            
            <AgentExecutor />
          </div>
          
          {/* 右侧：状态面板 */}
          <div className="lg:col-span-4 space-y-6">
            {/* 统计卡片 */}
            <StatsCards stats={stats} />
            
            {/* Agent 状态 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-500/30 rounded-lg">
                    <FiCpu className="w-4 h-4 text-purple-300" />
                  </div>
                  <h3 className="font-semibold text-white">Agent 状态</h3>
                </div>
              </div>
              <div className="p-4">
                <AgentList />
              </div>
            </div>

            {/* 快捷操作 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/30 rounded-lg">
                    <FiPlay className="w-4 h-4 text-blue-300" />
                  </div>
                  <h3 className="font-semibold text-white">快捷操作</h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <button 
                  onClick={() => setShowSessionHistory(!showSessionHistory)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 hover:from-cyan-500/30 hover:to-cyan-600/20 text-cyan-300 transition-all border border-cyan-500/20 group"
                >
                  <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                    <FiTrendingUp className="w-5 h-5" />
                  </div>
                  <span className="font-medium">查看会话历史</span>
                </button>
                <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-purple-600/10 hover:from-purple-500/30 hover:to-purple-600/20 text-purple-300 transition-all border border-purple-500/20 group">
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <FiPlay className="w-5 h-5" />
                  </div>
                  <span className="font-medium">运行完整工作流</span>
                </button>
              </div>
            </div>
            
            {/* 会话历史面板 */}
            {showSessionHistory && (
              <SessionHistory 
                onNewSession={() => setShowSessionHistory(false)}
              />
            )}
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="relative bg-slate-900/50 backdrop-blur-sm border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-center text-sm text-white/30 flex items-center justify-center gap-1">
            Made with <FiHeart className="w-4 h-4 text-pink-400" /> by AI Agents
          </p>
        </div>
      </footer>
    </div>
  );
};