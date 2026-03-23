export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  capabilities: string[];
  lastExecutionTime?: string;
  executionCount: number;
}

export interface WorkflowState {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'paused' | 'failed';
  currentStep: number;
  totalSteps: number;
  progress: number; // 0-100
  agents: AgentInfo[];
  artifacts: ArtifactInfo[];
}

export interface TaskProgress {
  taskId: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  estimatedCompletion?: string;
  progress: number; // 0-100
}

export interface ArtifactInfo {
  id: string;
  name: string;
  type: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}