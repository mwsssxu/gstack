import React from 'react';
import { AgentList } from '../components/AgentCard';
import { AgentExecutor } from '../components/AgentExecutor';
import { FiGithub, FiHeart } from 'react-icons/fi';

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">多 Agent 协作指挥中心</h1>
              <p className="text-sm text-gray-500">AI 驱动的智能工作流</p>
            </div>
          </div>
          <a 
            href="https://github.com/mwsssxu/gstack" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FiGithub className="w-5 h-5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧：执行器 (占3列) */}
          <div className="lg:col-span-3">
            <AgentExecutor />
          </div>
          
          {/* 右侧：Agent 列表 (占1列) */}
          <div className="lg:col-span-1">
            <AgentList />
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p className="flex items-center justify-center gap-1">
            Made with <FiHeart className="w-4 h-4 text-red-500" /> by AI Agents
          </p>
        </div>
      </footer>
    </div>
  );
};