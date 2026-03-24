import { AgentInfo, WorkflowState, TaskProgress } from '../store/types';

const API_BASE_URL = '/api';

interface ApiResponse<T> {
  status: string;
  data: T;
  count?: number;
}

export interface Session {
  session_id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface Execution {
  id: number;
  agent_name: string;
  step_index: number;
  status: string;
  user_input: string;
  output_result: string;
  output_type: string;
  used_fallback: boolean;
  execution_time: number;
  started_at: string;
  completed_at: string;
}

export interface SessionContext {
  session_id: string;
  title: string;
  status: string;
  created_at: string;
  executions: Execution[];
  messages: Array<{
    role: string;
    content: string;
    agent_name: string;
    created_at: string;
  }>;
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
    console.log('executeAgent called:', { agentName, context });
    try {
      const response = await fetch(`${API_BASE_URL}/agents/${agentName}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context })
      });
      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to execute agent: ${response.status} - ${errorText}`);
      }
      const json: ApiResponse<any> = await response.json();
      console.log('Response data:', json);
      return json.data;
    } catch (error) {
      console.error('executeAgent error:', error);
      throw error;
    }
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

  // ============ 会话管理 API ============

  async createSession(title?: string): Promise<Session> {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status}`);
    }
    const json: ApiResponse<Session> = await response.json();
    return json.data;
  },

  async listSessions(): Promise<Session[]> {
    const response = await fetch(`${API_BASE_URL}/sessions`);
    if (!response.ok) {
      throw new Error(`Failed to list sessions: ${response.status}`);
    }
    const json: ApiResponse<Session[]> = await response.json();
    return json.data || [];
  },

  async getSession(sessionId: string): Promise<SessionContext> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.status}`);
    }
    const json: ApiResponse<SessionContext> = await response.json();
    return json.data;
  },

  async getSessionExecutions(sessionId: string): Promise<Execution[]> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/executions`);
    if (!response.ok) {
      throw new Error(`Failed to get executions: ${response.status}`);
    }
    const json: ApiResponse<Execution[]> = await response.json();
    return json.data || [];
  },

  async pauseSession(sessionId: string): Promise<Session> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/pause`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error(`Failed to pause session: ${response.status}`);
    }
    const json: ApiResponse<Session> = await response.json();
    return json.data;
  },

  async completeSession(sessionId: string): Promise<Session> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/complete`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error(`Failed to complete session: ${response.status}`);
    }
    const json: ApiResponse<Session> = await response.json();
    return json.data;
  },

  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.status}`);
    }
  },

  async resumeExecution(sessionId: string, nextAgent?: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/sessions/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, next_agent: nextAgent })
    });
    if (!response.ok) {
      throw new Error(`Failed to resume execution: ${response.status}`);
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