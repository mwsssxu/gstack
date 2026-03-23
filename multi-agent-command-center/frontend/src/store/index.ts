import { create } from 'zustand';
import { AgentInfo, WorkflowState, TaskProgress } from './types';

interface AppState {
  // Agent 相关状态
  agents: AgentInfo[];
  workflows: WorkflowState[];
  tasks: TaskProgress[];
  
  // WebSocket 连接状态
  wsConnected: boolean;
  
  // Actions
  setAgents: (agents: AgentInfo[]) => void;
  setWorkflows: (workflows: WorkflowState[]) => void;
  setTasks: (tasks: TaskProgress[]) => void;
  setWsConnected: (connected: boolean) => void;
  
  // 添加新的 Agent 状态
  addAgent: (agent: AgentInfo) => void;
  updateAgent: (agentId: string, updates: Partial<AgentInfo>) => void;
  
  // 添加新的工作流状态
  addWorkflow: (workflow: WorkflowState) => void;
  updateWorkflow: (workflowId: string, updates: Partial<WorkflowState>) => void;
  
  // 添加新的任务进度
  addTask: (task: TaskProgress) => void;
  updateTask: (taskId: string, updates: Partial<TaskProgress>) => void;
}

export const useStore = create<AppState>((set, get) => ({
  agents: [],
  workflows: [],
  tasks: [],
  wsConnected: false,
  
  setAgents: (agents) => set({ agents }),
  setWorkflows: (workflows) => set({ workflows }),
  setTasks: (tasks) => set({ tasks }),
  setWsConnected: (wsConnected) => set({ wsConnected }),
  
  addAgent: (agent) => set((state) => ({
    agents: [...state.agents, agent]
  })),
  
  updateAgent: (agentId, updates) => set((state) => ({
    agents: state.agents.map(agent =>
      agent.id === agentId ? { ...agent, ...updates } : agent
    )
  })),
  
  addWorkflow: (workflow) => set((state) => ({
    workflows: [...state.workflows, workflow]
  })),
  
  updateWorkflow: (workflowId, updates) => set((state) => ({
    workflows: state.workflows.map(workflow =>
      workflow.id === workflowId ? { ...workflow, ...updates } : workflow
    )
  })),
  
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]
  })),
  
  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.taskId === taskId ? { ...task, ...updates } : task
    )
  })),
}));