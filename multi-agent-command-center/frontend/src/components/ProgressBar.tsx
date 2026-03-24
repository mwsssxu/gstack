import React from 'react';
import { FiClock } from 'react-icons/fi';

interface ProgressBarProps {
  progress: number; // 0-100
  status?: 'pending' | 'running' | 'completed' | 'error';
  showLabel?: boolean;
  showTime?: boolean;
  estimatedTime?: number; // 秒
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getGradient = (status: string): string => {
  switch (status) {
    case 'running':
      return 'from-cyan-400 via-blue-500 to-purple-500';
    case 'completed':
      return 'from-emerald-400 to-green-500';
    case 'error':
      return 'from-red-400 to-orange-500';
    default:
      return 'from-gray-400 to-gray-500';
  }
};

const getHeight = (size: string): string => {
  switch (size) {
    case 'sm': return 'h-1';
    case 'lg': return 'h-3';
    default: return 'h-2';
  }
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status = 'pending',
  showLabel = true,
  showTime = false,
  estimatedTime,
  size = 'md',
  className = ''
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className={`w-full ${className}`}>
      {/* 进度条 */}
      <div className={`w-full ${getHeight(size)} bg-white/10 rounded-full overflow-hidden relative`}>
        {/* 背景发光效果 */}
        {status === 'running' && (
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 animate-pulse"></div>
        )}
        
        {/* 进度填充 */}
        <div
          className={`${getHeight(size)} bg-gradient-to-r ${getGradient(status)} rounded-full transition-all duration-500 ease-out relative`}
          style={{ width: `${clampedProgress}%` }}
        >
          {/* 运行中动画 */}
          {status === 'running' && (
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          )}
        </div>
      </div>
      
      {/* 标签和时间 */}
      {(showLabel || showTime) && (
        <div className="flex items-center justify-between mt-1.5">
          {showLabel && (
            <span className={`text-xs ${
              status === 'completed' ? 'text-emerald-300' :
              status === 'error' ? 'text-red-300' :
              status === 'running' ? 'text-cyan-300' : 'text-white/50'
            }`}>
              {status === 'completed' ? '完成' :
               status === 'error' ? '失败' :
               status === 'running' ? `${Math.round(clampedProgress)}%` : '等待中'}
            </span>
          )}
          
          {showTime && estimatedTime && status === 'running' && (
            <div className="flex items-center gap-1 text-xs text-white/40">
              <FiClock className="w-3 h-3" />
              <span>约 {estimatedTime}s</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 多阶段进度条
interface Stage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
}

interface MultiStageProgressProps {
  stages: Stage[];
  className?: string;
}

export const MultiStageProgress: React.FC<MultiStageProgressProps> = ({
  stages,
  className = ''
}) => {
  const totalProgress = stages.reduce((sum, stage) => {
    if (stage.status === 'completed') return sum + 100;
    if (stage.status === 'running') return sum + stage.progress;
    return sum;
  }, 0) / stages.length;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 总进度 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-white/70">总体进度</span>
        <span className="text-sm text-cyan-300 font-medium">{Math.round(totalProgress)}%</span>
      </div>
      
      {/* 总进度条 */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${totalProgress}%` }}
        ></div>
      </div>
      
      {/* 阶段列表 */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {stages.map((stage, index) => (
          <div key={index} className="p-2.5 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-white/70">{stage.name}</span>
              {stage.status === 'completed' && (
                <span className="text-xs text-emerald-300">✓</span>
              )}
              {stage.status === 'running' && (
                <span className="text-xs text-cyan-300 animate-pulse">...</span>
              )}
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  stage.status === 'completed' ? 'bg-emerald-400' :
                  stage.status === 'error' ? 'bg-red-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${stage.status === 'completed' ? 100 : stage.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 环形进度
interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  status?: 'pending' | 'running' | 'completed' | 'error';
  showLabel?: boolean;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  status = 'pending',
  showLabel = true,
  className = ''
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  const getColor = () => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'error': return '#ef4444';
      case 'running': return '#22d3ee';
      default: return '#6b7280';
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* 背景圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* 进度圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;