import React, { useState, useCallback, useMemo } from 'react';
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
  addEdge,
  Connection,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FiPlus, FiSave, FiDownload, FiTrash2, FiSettings, FiPlay, FiX } from 'react-icons/fi';

// Agent 类型定义
interface AgentDefinition {
  id: string;
  name: string;
  display_name: string;
  description: string;
  color: string;
}

// 可用的 Agent 列表
const AVAILABLE_AGENTS: AgentDefinition[] = [
  { id: 'product_thinker', name: 'product_thinker', display_name: '产品思考者', description: '生成设计文档', color: 'from-blue-400 to-blue-600' },
  { id: 'architect', name: 'architect', display_name: '架构设计师', description: '架构设计', color: 'from-purple-400 to-purple-600' },
  { id: 'paranoid_expert', name: 'paranoid_expert', display_name: '偏执专家', description: '审查缺陷', color: 'from-red-400 to-red-600' },
  { id: 'quality_expert', name: 'quality_expert', display_name: '质量专家', description: '测试评估', color: 'from-green-400 to-green-600' },
  { id: 'release_expert', name: 'release_expert', display_name: '发布专家', description: '安全发布', color: 'from-orange-400 to-orange-600' },
  { id: 'strategy_planner', name: 'strategy_planner', display_name: '战略规划师', description: '制定计划', color: 'from-cyan-400 to-cyan-600' },
];

// 交接条件
const HANDOFF_CONDITIONS = [
  { value: 'on_success', label: '成功时', color: '#10B981' },
  { value: 'on_approved', label: '审核通过', color: '#3B82F6' },
  { value: 'on_rejected', label: '审核不通过', color: '#EF4444' },
  { value: 'on_quality_pass', label: '质量通过', color: '#8B5CF6' },
  { value: 'on_failure', label: '失败时', color: '#F59E0B' },
];

// 自定义 Agent 节点
const EditableAgentNode: React.FC<NodeProps> = ({ data, selected }) => {
  const agent = AVAILABLE_AGENTS.find(a => a.id === data.agentId);
  
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-400 border-2 border-white"
      />
      
      <div className={`
        px-4 py-3 rounded-xl shadow-lg
        bg-gradient-to-br ${agent?.color || 'from-gray-400 to-gray-600'}
        min-w-[140px] cursor-pointer
        border-2 ${selected ? 'border-white' : 'border-transparent'}
        hover:scale-105 transition-transform
      `}>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-white text-sm">{data.label}</span>
        </div>
        <p className="text-white/80 text-xs">{agent?.description}</p>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-green-400 border-2 border-white"
      />
    </div>
  );
};

// 起点节点
const StartNode: React.FC<NodeProps> = ({ selected }) => (
  <div className={`
    w-12 h-12 rounded-full bg-green-500 flex items-center justify-center
    border-2 ${selected ? 'border-white' : 'border-green-300'}
    shadow-lg cursor-pointer
  `}>
    <span className="text-white font-bold">开始</span>
  </div>
);

// 终点节点
const EndNode: React.FC<NodeProps> = ({ selected }) => (
  <div className={`
    w-12 h-12 rounded-full bg-red-500 flex items-center justify-center
    border-2 ${selected ? 'border-white' : 'border-red-300'}
    shadow-lg cursor-pointer
  `}>
    <span className="text-white font-bold">结束</span>
  </div>
);

const nodeTypes = {
  agent: EditableAgentNode,
  start: StartNode,
  end: EndNode,
};

// 初始节点
const initialNodes: Node[] = [
  { id: 'start', type: 'start', position: { x: 50, y: 200 }, data: { label: '开始' } },
  { id: 'end', type: 'end', position: { x: 800, y: 200 }, data: { label: '结束' } },
];

const initialEdges: Edge[] = [];

export const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showConditionPanel, setShowConditionPanel] = useState(false);
  const [workflowName, setWorkflowName] = useState('新工作流');

  // 连接处理
  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return;
    
    const newEdge: Edge = {
      id: `e-${params.source}-${params.target}-${Date.now()}`,
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      animated: true,
      style: { stroke: '#3B82F6', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3B82F6' },
      data: { condition: 'on_success' },
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  // 边点击处理
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setShowConditionPanel(true);
  }, []);

  // 拖拽添加节点
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const agentId = event.dataTransfer.getData('application/reactflow');
    if (!agentId) return;

    const agent = AVAILABLE_AGENTS.find(a => a.id === agentId);
    if (!agent) return;

    const position = {
      x: event.clientX - 200,
      y: event.clientY - 100,
    };

    const newNode: Node = {
      id: `${agentId}-${Date.now()}`,
      type: 'agent',
      position,
      data: { 
        label: agent.display_name, 
        agentId: agent.id,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  // 删除节点
  const deleteSelectedNodes = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, [setNodes, setEdges]);

  // 更新边条件
  const updateEdgeCondition = useCallback((condition: string) => {
    if (!selectedEdge) return;
    
    const condConfig = HANDOFF_CONDITIONS.find(c => c.value === condition);
    
    setEdges((eds) =>
      eds.map((e) =>
        e.id === selectedEdge.id
          ? {
              ...e,
              data: { ...e.data, condition },
              style: { stroke: condConfig?.color || '#3B82F6', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: condConfig?.color || '#3B82F6' },
              label: condition !== 'on_success' ? condConfig?.label : undefined,
            }
          : e
      )
    );
    setShowConditionPanel(false);
  }, [selectedEdge, setEdges]);

  // 保存工作流
  const saveWorkflow = useCallback(() => {
    const workflow = {
      name: workflowName,
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        data: e.data,
      })),
      savedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [workflowName, nodes, edges]);

  // 加载工作流
  const loadWorkflow = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target?.result as string);
        setWorkflowName(workflow.name);
        setNodes(workflow.nodes);
        setEdges(workflow.edges);
      } catch (error) {
        console.error('Failed to load workflow:', error);
        alert('无效的工作流文件');
      }
    };
    reader.readAsText(file);
  }, [setNodes, setEdges]);

  return (
    <div className="flex h-[600px] bg-gray-50 rounded-lg overflow-hidden">
      {/* 左侧 Agent 面板 */}
      <div className="w-48 bg-white border-r p-3 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">拖拽添加 Agent</h3>
        
        <div className="space-y-2">
          {AVAILABLE_AGENTS.map((agent) => (
            <div
              key={agent.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', agent.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              className={`
                p-3 rounded-lg cursor-grab
                bg-gradient-to-r ${agent.color}
                text-white text-sm font-medium
                hover:shadow-md transition-shadow
                active:cursor-grabbing
              `}
            >
              {agent.display_name}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 mb-2">工具</p>
          <div className="space-y-2">
            <div
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', 'start');
              }}
              className="p-2 rounded-lg bg-green-100 text-green-700 text-sm cursor-grab"
            >
              ○ 开始节点
            </div>
            <div
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', 'end');
              }}
              className="p-2 rounded-lg bg-red-100 text-red-700 text-sm cursor-grab"
            >
              ○ 结束节点
            </div>
          </div>
        </div>
      </div>

      {/* 主编辑区域 */}
      <div className="flex-1 flex flex-col">
        {/* 工具栏 */}
        <div className="bg-white border-b px-4 py-2 flex items-center gap-4">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
            placeholder="工作流名称"
          />
          
          <div className="flex-1" />
          
          <button
            onClick={deleteSelectedNodes}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            <FiTrash2 /> 删除
          </button>
          
          <label className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded cursor-pointer">
            <FiDownload /> 加载
            <input type="file" accept=".json" onChange={loadWorkflow} className="hidden" />
          </label>
          
          <button
            onClick={saveWorkflow}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded"
          >
            <FiSave /> 保存
          </button>
        </div>

        {/* ReactFlow 画布 */}
        <div className="flex-1" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode="Delete"
          >
            <Background color="#E5E7EB" gap={20} />
            <Controls />
            <MiniMap />
            
            <Panel position="bottom-center">
              <div className="bg-white px-3 py-1.5 rounded shadow text-xs text-gray-500">
                拖拽左侧 Agent 到画布 · 点击连线设置条件 · Delete 删除选中
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* 右侧条件配置面板 */}
      {showConditionPanel && selectedEdge && (
        <div className="w-56 bg-white border-l p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">设置条件</h3>
            <button onClick={() => setShowConditionPanel(false)} className="text-gray-400 hover:text-gray-600">
              <FiX />
            </button>
          </div>
          
          <div className="space-y-2">
            {HANDOFF_CONDITIONS.map((cond) => (
              <button
                key={cond.value}
                onClick={() => updateEdgeCondition(cond.value)}
                className={`
                  w-full text-left px-3 py-2 rounded text-sm
                  ${selectedEdge.data?.condition === cond.value 
                    ? 'bg-blue-50 border border-blue-300 text-blue-700' 
                    : 'hover:bg-gray-50'}
                `}
                style={{ borderLeftColor: cond.color, borderLeftWidth: 3 }}
              >
                {cond.label}
              </button>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500">
              当前连线：{selectedEdge.source} → {selectedEdge.target}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowEditor;