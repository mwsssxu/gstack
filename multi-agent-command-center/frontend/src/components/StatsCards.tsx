import React from 'react';
import { FiActivity, FiCheckCircle, FiAlertTriangle, FiClock, FiTrendingUp, FiZap } from 'react-icons/fi';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'blue' | 'green' | 'red' | 'purple' | 'cyan';
}

const getColorClasses = (color: string) => {
  switch (color) {
    case 'green':
      return {
        bg: 'from-emerald-500/20 to-emerald-600/10',
        icon: 'bg-emerald-500/30',
        text: 'text-emerald-300',
        glow: 'shadow-emerald-500/20'
      };
    case 'red':
      return {
        bg: 'from-red-500/20 to-red-600/10',
        icon: 'bg-red-500/30',
        text: 'text-red-300',
        glow: 'shadow-red-500/20'
      };
    case 'purple':
      return {
        bg: 'from-purple-500/20 to-purple-600/10',
        icon: 'bg-purple-500/30',
        text: 'text-purple-300',
        glow: 'shadow-purple-500/20'
      };
    case 'cyan':
      return {
        bg: 'from-cyan-500/20 to-cyan-600/10',
        icon: 'bg-cyan-500/30',
        text: 'text-cyan-300',
        glow: 'shadow-cyan-500/20'
      };
    default:
      return {
        bg: 'from-blue-500/20 to-blue-600/10',
        icon: 'bg-blue-500/30',
        text: 'text-blue-300',
        glow: 'shadow-blue-500/20'
      };
  }
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color
}) => {
  const colors = getColorClasses(color);
  
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${colors.bg} border border-white/10 hover:border-white/20 transition-all duration-300 group hover:shadow-lg ${colors.glow}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/50 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-white/40 mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 ${
              trend === 'up' ? 'text-emerald-400' :
              trend === 'down' ? 'text-red-400' : 'text-white/40'
            }`}>
              <FiTrendingUp className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
              <span className="text-xs">{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${colors.icon} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

interface StatsCardsProps {
  stats?: {
    totalExecutions?: number;
    successRate?: number;
    avgExecutionTime?: number;
    activeAgents?: number;
  };
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const defaultStats = {
    totalExecutions: 0,
    successRate: 0,
    avgExecutionTime: 0,
    activeAgents: 2
  };
  
  const s = { ...defaultStats, ...stats };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        title="总执行次数"
        value={s.totalExecutions ?? 0}
        subtitle="累计执行任务"
        icon={<FiActivity className="w-5 h-5 text-blue-300" />}
        color="blue"
      />
      <StatCard
        title="成功率"
        value={`${s.successRate ?? 0}%`}
        subtitle="执行成功比例"
        icon={<FiCheckCircle className="w-5 h-5 text-emerald-300" />}
        trend={(s.successRate ?? 0) >= 80 ? 'up' : 'down'}
        trendValue={(s.successRate ?? 0) >= 80 ? '良好' : '需关注'}
        color="green"
      />
      <StatCard
        title="平均时长"
        value={`${((s.avgExecutionTime ?? 0) / 1000).toFixed(1)}s`}
        subtitle="平均执行时间"
        icon={<FiClock className="w-5 h-5 text-purple-300" />}
        color="purple"
      />
      <StatCard
        title="活跃 Agent"
        value={s.activeAgents ?? 0}
        subtitle="在线工作节点"
        icon={<FiZap className="w-5 h-5 text-cyan-300" />}
        color="cyan"
      />
    </div>
  );
};

// 迷你统计行
interface MiniStatsProps {
  executions: number;
  success: number;
  failed: number;
  avgTime: number;
}

export const MiniStats: React.FC<MiniStatsProps> = ({
  executions,
  success,
  failed,
  avgTime
}) => {
  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
        <span className="text-white/50">执行</span>
        <span className="text-white font-medium">{executions}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
        <span className="text-white/50">成功</span>
        <span className="text-white font-medium">{success}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-red-400"></div>
        <span className="text-white/50">失败</span>
        <span className="text-white font-medium">{failed}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <FiClock className="w-3 h-3 text-purple-400" />
        <span className="text-white/50">均时</span>
        <span className="text-white font-medium">{(avgTime / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
};

// 活动状态指示器
interface ActivityIndicatorProps {
  status: 'idle' | 'active' | 'error';
  message?: string;
}

export const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  status,
  message
}) => {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
      status === 'active' 
        ? 'bg-cyan-500/20 text-cyan-300' 
        : status === 'error'
          ? 'bg-red-500/20 text-red-300'
          : 'bg-white/5 text-white/50'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        status === 'active' 
          ? 'bg-cyan-400 animate-pulse' 
          : status === 'error'
            ? 'bg-red-400'
            : 'bg-white/30'
      }`}></div>
      <span>{message || (status === 'active' ? '运行中' : status === 'error' ? '异常' : '空闲')}</span>
    </div>
  );
};

export default StatsCards;