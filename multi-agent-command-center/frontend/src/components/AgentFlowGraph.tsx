import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Position,
  MarkerType,
  NodeProps,
  Handle,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { api } from '../services/api';
import { FiCpu, FiPlay, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';

interface AgentData {
  name: string;
  display_name: string;
  responsibility: string;
  inputs_from: string[];
  outputs_to: Array<{ target: string; condition: string; description: string }>;
  feedback_to: string | null;
  quality_gate: any;
}

// Agent 节点组件
const AgentNode: React.FC<NodeProps> = ({ data }) => {
  const statusColors: Record<string, string> = {
    idle: 'from-gray-400 to-gray-500',
    running: 'from-blue-400 to-blue-600 animate-pulse',
    completed: 'from-green-400 to-green-600',
    error: 'from-red-400 to-red-600',
  };

  const status = data.status || 'idle';

  return (
    <div className="relative">
      {/* 输入 Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-400 border-2 border-white"
      />
      
      {/* 节点内容 */}
      <div className={`
        px-4 py-3 rounded-xl shadow-lg
        bg-gradient-to-br ${statusColors[status]}
        min-w-[160px] cursor-pointer
        border border-white/20
        hover:scale-105 transition-transform
      `}>
        <div className="flex items-center gap-2 mb-1">
          <FiCpu className="w-4 h-4 text-white" />
          <span className="font-semibold text-white text-sm">{data.display_name}</span>
        </div>
        <p className="text-white/80 text-xs truncate">{data.responsibility?.slice(0, 30)}...</p>
        
        {/* 状态指示器 */}
        <div className="absolute -top-1 -right-1">
          {status === 'running' && <FiPlay className="w-4 h-4 text-white animate-spin" />}
          {status === 'completed' && <FiCheckCircle className="w-4 h-4 text-white" />}
          {status === 'error' && <FiAlertCircle className="w-4 h-4 text-white" />}
          {status === 'idle' && <FiClock className="w-4 h-4 text-white/60" />}
        </div>
      </div>
      
      {/* 输出 Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-green-400 border-2 border-white"
      />
    </div>
  );
};

// 用户节点组件
const UserNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="px-4 py-3 rounded-xl shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 min-w-[120px] border border-white/20">
      <div className="flex items-center gap-2">
        <span className="text-2xl">👤</span>
        <span className="font-semibold text-white">{data.label}</span>
      </div>
    </div>
  );
};

const nodeTypes = {
  agent: AgentNode,
  user: UserNode,
};

export const AgentFlowGraph: React.FC = () => {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 加载 Agent 数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const workflowData = await api.getCollaborationWorkflow();
        const agentPromises = ['product_thinker', 'architect', 'paranoid_expert', 'quality_expert', 'release_expert'].map(
          name => api.getAgentCollaboration(name)
        );
        const agentData = await Promise.all(agentPromises);
        setAgents(agentData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load agent data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 构建 nodes 和 edges
  useEffect(() => {
    if (agents.length === 0) return;

    // 定义节点位置
    const nodePositions: Record<string, { x: number; y: number }> = {
      'user-input': { x: 50, y: 200 },
      'product_thinker': { x: 250, y: 200 },
      'architect': { x: 450, y: 200 },
      'paranoid_expert': { x: 650, y: 200 },
      'quality_expert': { x: 850, y: 200 },
      'release_expert': { x: 1050, y: 200 },
      'user-output': { x: 1250, y: 200 },
    };

    // 创建节点
    const newNodes: Node[] = [
      {
        id: 'user-input',
        type: 'user',
        position: nodePositions['user-input'],
        data: { label: '用户输入' },
      },
      ...agents.map((agent, index) => ({
        id: agent.name,
        type: 'agent',
        position: nodePositions[agent.name],
        data: {
          ...agent,
          status: 'idle',
        },
      })),
      {
        id: 'user-output',
        type: 'user',
        position: nodePositions['user-output'],
        data: { label: '完成' },
      },
    ];

    // 创建边
    const newEdges: Edge[] = [];
    
    // 用户输入 -> 产品思考者
    newEdges.push({
      id: 'e-user-input',
      source: 'user-input',
      target: 'product_thinker',
      animated: true,
      style: { stroke: '#8B5CF6', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#8B5CF6' },
    });

    // Agent 之间的边
    agents.forEach(agent => {
      agent.outputs_to.forEach((output, index) => {
        const targetId = output.target === 'user' ? 'user-output' : output.target;
        const edgeColor = output.condition === 'on_approved' ? '#10B981' :
                         output.condition === 'on_rejected' ? '#EF4444' :
                         output.condition === 'on_quality_pass' ? '#8B5CF6' : '#3B82F6';
        
        newEdges.push({
          id: `e-${agent.name}-${targetId}-${index}`,
          source: agent.name,
          target: targetId,
          animated: output.condition === 'on_success',
          style: { stroke: edgeColor, strokeWidth: 2 },
          label: output.condition === 'on_rejected' ? '修订' : undefined,
          labelStyle: { fill: '#EF4444', fontWeight: 700 },
          labelBgStyle: { fill: '#FEE2E2' },
          markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [agents, setNodes, setEdges]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">加载工作流图...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 h-[400px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#E5E7EB" gap={16} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'user') return '#8B5CF6';
            return '#3B82F6';
          }}
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>
    </div>
  );
};

// 工作流执行进度组件
export const WorkflowProgress: React.FC<{
  currentStep: string;
  progress: number;
  status: string;
}> = ({ currentStep, progress, status }) => {
  const steps = [
    { id: 'product_thinker', label: '产品思考者', icon: '💡' },
    { id: 'architect', label: '架构设计', icon: '🏗️' },
    { id: 'paranoid_expert', label: '审查', icon: '🔍' },
    { id: 'quality_expert', label: '质量测试', icon: '✅' },
    { id: 'release_expert', label: '发布准备', icon: '🚀' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-lg
              ${index < currentStepIndex ? 'bg-green-500' : 
                index === currentStepIndex ? 'bg-blue-500 animate-pulse' : 'bg-gray-200'}
            `}>
              {index < currentStepIndex ? '✓' : step.icon}
            </div>
            <span className={`
              ml-2 text-sm font-medium
              ${index === currentStepIndex ? 'text-blue-600' : 'text-gray-500'}
            `}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`
                w-12 h-1 mx-2 rounded
                ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}
              `} />
            )}
          </div>
        ))}
      </div>
      
      {/* 进度条 */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>进度: {progress}%</span>
          <span>{status}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};