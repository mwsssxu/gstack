import React from 'react';
import { AgentList } from '../components/AgentCard';
import { AgentExecutor } from '../components/AgentExecutor';
import { FiGithub, FiHeart, FiCpu, FiPlay, FiFileText } from 'react-icons/fi';

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 顶部导航 */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-40"></div>
                <div className="relative p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <FiCpu className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">多 Agent 协作指挥中心</h1>
                <p className="text-sm text-slate-500">AI-Powered Intelligent Workflow</p>
              </div>
            </div>
            <a 
              href="https://github.com/mwsssxu/gstack" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
            >
              <FiGithub className="w-5 h-5" />
              <span className="font-medium">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 功能区域标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-800">工作台</h2>
          </div>
          <p className="text-slate-500 ml-3">选择 Agent 并执行任务，查看生成结果</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧：执行区域 */}
          <div className="lg:col-span-8">
            {/* 步骤指示器 */}
            <div className="bg-white rounded-2xl p-4 mb-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold">1</div>
                  <span className="text-sm font-medium text-slate-700">选择 Agent</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-200 mx-4"></div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-500 text-sm font-bold">2</div>
                  <span className="text-sm text-slate-500">输入想法</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-200 mx-4"></div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-500 text-sm font-bold">3</div>
                  <span className="text-sm text-slate-500">查看结果</span>
                </div>
              </div>
            </div>
            
            <AgentExecutor />
          </div>
          
          {/* 右侧：状态面板 */}
          <div className="lg:col-span-4 space-y-6">
            {/* Agent 状态 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FiCpu className="w-5 h-5 text-slate-400" />
                  <h3 className="font-semibold text-slate-800">Agent 状态</h3>
                </div>
              </div>
              <div className="p-4">
                <AgentList />
              </div>
            </div>

            {/* 快捷操作 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FiPlay className="w-5 h-5 text-slate-400" />
                  <h3 className="font-semibold text-slate-800">快捷操作</h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors">
                  <FiFileText className="w-5 h-5" />
                  <span className="font-medium">新建设计文档</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors">
                  <FiPlay className="w-5 h-5" />
                  <span className="font-medium">运行完整工作流</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-center text-sm text-slate-400 flex items-center justify-center gap-1">
            Made with <FiHeart className="w-4 h-4 text-red-400" /> by AI Agents
          </p>
        </div>
      </footer>
    </div>
  );
};