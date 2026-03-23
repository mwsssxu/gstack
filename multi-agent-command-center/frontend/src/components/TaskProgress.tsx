import React, { useEffect } from 'react';
import { useStore } from '../store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TaskProgressProps {
  task: any; // TODO: Replace with proper type
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running':
      return '#3B82F6';
    case 'completed':
      return '#10B981';
    case 'failed':
      return '#EF4444';
    case 'pending':
      return '#9CA3AF';
    default:
      return '#9CA3AF';
  }
};

export const TaskProgress: React.FC<TaskProgressProps> = ({ task }) => {
  // 模拟时间序列数据
  const timeData = [
    { time: '00:00', progress: 0 },
    { time: '00:15', progress: Math.min(25, task.progress) },
    { time: '00:30', progress: Math.min(50, task.progress) },
    { time: '00:45', progress: Math.min(75, task.progress) },
    { time: '01:00', progress: task.progress },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-md font-medium text-gray-900">任务 {task.taskId}</h3>
        <span 
          className={`px-2 py-1 rounded-full text-xs ${
            task.status === 'running' ? 'bg-blue-100 text-blue-800' :
            task.status === 'completed' ? 'bg-green-100 text-green-800' :
            task.status === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}
        >
          {task.status === 'running' ? '运行中' :
           task.status === 'completed' ? '已完成' :
           task.status === 'failed' ? '失败' : '待处理'}
        </span>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Agent: {task.agentId}</span>
          <span>{task.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full" 
            style={{ 
              width: `${task.progress}%`,
              backgroundColor: getStatusColor(task.status)
            }}
          ></div>
        </div>
      </div>
      
      <div className="h-32">
        <ResponsiveContainer width="10 t%" height="100%">
          <LineChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="progress" 
              stroke={getStatusColor(task.status)} 
              strokeWidth={2} 
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const TaskList: React.FC = () => {
  const tasks = useStore((state) => state.tasks);
  
  // 由于后端暂未实现任务API，这里模拟一些数据
  useEffect(() => {
    if (tasks.length === 0) {
      // 模拟初始任务数据
      const mockTasks: any[] = [
        {
          taskId: 'task-1',
          agentId: 'product_thinker',
          status: 'completed' as const,
          progress: 100,
          startTime: new Date(Date.now() - 3600000).toISOString(),
          endTime: new Date().toISOString()
        },
        {
          taskId: 'task-2',
          agentId: 'strategy_planner',
          status: 'running' as const,
          progress: 65,
          startTime: new Date(Date.now() - 1800000).toISOString()
        },
        {
          taskId: 'task-3',
          agentId: 'code_reviewer',
          status: 'pending' as const,
          progress: 0
        }
      ];
      useStore.getState().setTasks(mockTasks);
    }
  }, [tasks.length]);
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        任务进度
      </h2>
      {tasks.length === 0 ? (
        <p className="text-gray-600">暂无任务数据</p>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskProgress key={task.taskId} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};