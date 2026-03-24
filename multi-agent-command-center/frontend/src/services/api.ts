import { AgentInfo, WorkflowState, TaskProgress } from '../store/types';

const API_BASE_URL = '/api';

interface ApiResponse<T> {
  status: string;
  data: T;
  count?: number;
}

export const api = {
  // Agent 相关 API
  async getAgents(): Promise<AgentInfo[]> {
    const response = await fetch(`${API_BASE_URL}/agents`);
    if (!response.ok) {
      throw new Error(`Failed to fetch agents: ${response.status}`);
    }
    const json: ApiResponse<AgentInfo[]> = await response.json();
    return json.data || [];
  },

  async getAgentStates(): Promise<AgentInfo[]> {
    const response = await fetch(`${API_BASE_URL}/agents`);
    if (!response.ok) {
      throw new Error(`Failed to fetch agent states: ${response.status}`);
    }
    const json: ApiResponse<any[]> = await response.json();
    // 转换数据格式以匹配前端
    return (json.data || []).map((agent: any) => ({
      id: agent.name,
      name: agent.name,
      description: agent.description,
      status: agent.config?.enabled ? 'idle' : 'error' as const,
      capabilities: agent.capabilities || [],
      executionCount: 0
    }));
  },

  async executeAgent(agentName: string, context: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/agents/${agentName}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context })
    });
    if (!response.ok) {
      throw new Error(`Failed to execute agent: ${response.status}`);
    }
    const json: ApiResponse<any> = await response.json();
    return json.data;
  },

  // 工作流相关 API
  async getWorkflowStates(): Promise<WorkflowState[]> {
    const response = await fetch(`${API_BASE_URL}/workflows/states`);
    if (!response.ok) {
      throw new Error(`Failed to fetch workflow states: ${response.status}`);
    }
    const json: ApiResponse<WorkflowState[]> = await response.json();
    return json.data || [];
  },

  async executeWorkflow(workflowId: string, userIdea: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/workflows/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow_id: workflowId, user_idea: userIdea })
    });
    if (!response.ok) {
      throw new Error(`Failed to execute workflow: ${response.status}`);
    }
    const json: ApiResponse<any> = await response.json();
    return json.data;
  },

  // WebSocket 连接
  createWebSocket(): WebSocket {
    const ws = new WebSocket('ws://localhost:8000/api/ws');
    return ws;
  }
};