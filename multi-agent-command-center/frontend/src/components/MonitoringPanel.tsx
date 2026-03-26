import React, { useEffect, useState } from 'react';
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiActivity, FiClock, FiCpu, FiZap } from 'react-icons/fi';

interface Alert {
  id: string;
  level: string;
  source: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface HealthStatus {
  status: string;
  alerts: {
    critical: number;
    error: number;
    warning: number;
    total: number;
  };
  metrics: {
    agent_execution_time: { avg: number; latest: number };
    workflow_duration: { avg: number; latest: number };
    llm_response_time: { avg: number; latest: number };
  };
}

interface PerformanceSummary {
  agents: {
    total_executions: number;
    avg_execution_time: number;
    success_rate: number;
  };
  workflows: {
    total: number;
    completed: number;
    failed: number;
    avg_duration: number;
  };
  llm: {
    total_requests: number;
    avg_response_time: number;
  };
}

const API_BASE_URL = '/api';

export const MonitoringPanel: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 获取监控数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [healthRes, perfRes, alertsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/metrics/health`).then(r => r.json()),
          fetch(`${API_BASE_URL}/metrics/performance`).then(r => r.json()),
          fetch(`${API_BASE_URL}/alerts`).then(r => r.json()),
        ]);
        
        setHealth(healthRes.data);
        setPerformance(perfRes.data);
        setAlerts(alertsRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch monitoring data:', error);
        setLoading(false);
      }
    };

    fetchData();

    // 自动刷新
    if (autoRefresh) {
      const interval = setInterval(fetchData, 10000); // 10秒刷新
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      healthy: 'text-green-500 bg-green-50',
      warning: 'text-yellow-500 bg-yellow-50',
      error: 'text-red-500 bg-red-50',
      critical: 'text-red-700 bg-red-100',
    };
    return colors[status] || 'text-gray-500 bg-gray-50';
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'error':
        return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <FiAlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <FiCheckCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch(`${API_BASE_URL}/alerts/${alertId}/resolve`, { method: 'POST' });
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 系统健康状态 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">系统健康状态</h3>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            自动刷新
          </label>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className={`px-4 py-2 rounded-lg ${getStatusColor(health?.status || 'unknown')}`}>
            <span className="font-semibold uppercase">{health?.status || 'Unknown'}</span>
          </div>
          
          {/* 告警统计 */}
          <div className="flex gap-4">
            {health?.alerts.critical! > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <FiAlertCircle className="w-4 h-4" />
                <span className="text-sm">{health?.alerts.critical} 严重</span>
              </div>
            )}
            {health?.alerts.error! > 0 && (
              <div className="flex items-center gap-1 text-red-500">
                <FiAlertCircle className="w-4 h-4" />
                <span className="text-sm">{health?.alerts.error} 错误</span>
              </div>
            )}
            {health?.alerts.warning! > 0 && (
              <div className="flex items-center gap-1 text-yellow-500">
                <FiAlertTriangle className="w-4 h-4" />
                <span className="text-sm">{health?.alerts.warning} 警告</span>
              </div>
            )}
          </div>
        </div>

        {/* 关键指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Agent 执行时间"
            value={health?.metrics.agent_execution_time.avg?.toFixed(2) || '0'}
            unit="秒"
            icon={<FiCpu className="w-5 h-5" />}
          />
          <MetricCard
            title="工作流时长"
            value={health?.metrics.workflow_duration.avg?.toFixed(2) || '0'}
            unit="秒"
            icon={<FiClock className="w-5 h-5" />}
          />
          <MetricCard
            title="LLM 响应时间"
            value={health?.metrics.llm_response_time.avg?.toFixed(2) || '0'}
            unit="秒"
            icon={<FiZap className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* 性能统计 */}
      {performance && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">性能统计</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Agent 统计 */}
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Agent 执行</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">总执行次数</span>
                  <span className="font-semibold">{performance.agents.total_executions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">平均耗时</span>
                  <span className="font-semibold">{performance.agents.avg_execution_time.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">成功率</span>
                  <span className="font-semibold text-green-600">{performance.agents.success_rate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* 工作流统计 */}
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-3">工作流执行</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">总工作流</span>
                  <span className="font-semibold">{performance.workflows.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">已完成</span>
                  <span className="font-semibold text-green-600">{performance.workflows.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">失败</span>
                  <span className="font-semibold text-red-600">{performance.workflows.failed}</span>
                </div>
              </div>
            </div>

            {/* LLM 统计 */}
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-3">LLM 请求</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">总请求</span>
                  <span className="font-semibold">{performance.llm.total_requests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">平均响应</span>
                  <span className="font-semibold">{performance.llm.avg_response_time.toFixed(2)}s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 告警列表 */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">活动告警</h3>
          
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  alert.level === 'critical' || alert.level === 'error'
                    ? 'border-red-200 bg-red-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getAlertIcon(alert.level)}
                  <div>
                    <p className="font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500">
                      {alert.source} · {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50"
                >
                  解决
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 指标卡片组件
const MetricCard: React.FC<{
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
}> = ({ title, value, unit, icon }) => (
  <div className="border rounded-lg p-4">
    <div className="flex items-center gap-2 text-gray-500 mb-2">
      {icon}
      <span className="text-sm">{title}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="text-gray-500">{unit}</span>
    </div>
  </div>
);

export default MonitoringPanel;