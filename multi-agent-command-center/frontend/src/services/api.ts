import { AgentInfo, WorkflowState, TaskProgress } from '../store/types';

const API_BASE_URL = '/api';

export const api = {
  // Agent 相关 API
  async getAgents(): Promise<AgentInfo[]> {
    const response = await fetch(`${API_BASE_URL}/agents`);
    if (!response.ok) {
      throw new Error(`Failed to fetch agents: ${response.status}`);
    }
    return response.json();
  },

  async getAgentStates(): Promise<AgentInfo[]> {
    const response = await fetch(`${API_BASE_URL}/agents/states`);
    if (!response.ok) {
      throw new Error(`Failed to fetch agent states: ${response.status}`);
    }
    return response.json();
  },

  // 工作流相关 API
  async getWorkflowStates(): Promise<WorkflowState[]> {
    const response = await fetch(`${API_BASE_URL}/workflows/states`);
    if (!response.ok) {
      throw new Error(`Failed to fetch workflow states: ${response.status}`);
    }
    return response.json();
  },

  // WebSocket 连接
  createWebSocket(): WebSocket {
    const ws = new WebSocket('ws://localhost:8000/api/ws');
    return ws;
  }
};