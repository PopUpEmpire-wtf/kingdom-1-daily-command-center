/**
 * TaskFlow App Integration
 *
 * TaskFlow could refer to different apps:
 * 1. TaskFlow - Project Management App
 * 2. Things 3 (often called task flow)
 * 3. Any other task flow/management application
 *
 * This is a generic implementation that can be adapted
 * based on the specific TaskFlow API you're using.
 *
 * Setup requirements:
 * - TASKFLOW_API_URL
 * - TASKFLOW_API_KEY or TASKFLOW_ACCESS_TOKEN
 */

import axios, { AxiosInstance } from 'axios';

export interface TaskFlowTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  tags?: string[];
  projectId?: string;
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFlowProject {
  id: string;
  name: string;
  description?: string;
  status: string;
  tasks: TaskFlowTask[];
}

export class TaskFlowClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiKey = apiKey || process.env.TASKFLOW_API_KEY || '';

    const baseURL = apiUrl || process.env.TASKFLOW_API_URL || 'https://api.taskflow.app';

    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/v1/health');
      return response.status === 200;
    } catch (error) {
      console.error('TaskFlow connection test failed:', error);
      return false;
    }
  }

  async getProjects(): Promise<TaskFlowProject[]> {
    try {
      const response = await this.client.get('/v1/projects');
      return response.data.projects || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  async getTasks(projectId?: string): Promise<TaskFlowTask[]> {
    try {
      const url = projectId ? `/v1/projects/${projectId}/tasks` : '/v1/tasks';
      const response = await this.client.get(url);
      return response.data.tasks || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  async createTask(task: Partial<TaskFlowTask>): Promise<TaskFlowTask> {
    try {
      const response = await this.client.post('/v1/tasks', task);
      return response.data.task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, updates: Partial<TaskFlowTask>): Promise<TaskFlowTask> {
    try {
      const response = await this.client.patch(`/v1/tasks/${taskId}`, updates);
      return response.data.task;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await this.client.delete(`/v1/tasks/${taskId}`);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Alternative: Things 3 URL Scheme Integration
   * If TaskFlow refers to Things 3, use URL schemes instead of API
   */
  generateThings3URL(action: 'add' | 'show' | 'update', params: any): string {
    const baseURL = 'things:///';

    switch (action) {
      case 'add':
        const queryParams = new URLSearchParams({
          title: params.title || '',
          notes: params.notes || '',
          when: params.when || '',
          deadline: params.deadline || '',
          tags: params.tags?.join(',') || '',
          'checklist-items': params.checklistItems?.join('\n') || '',
          list: params.list || '',
          heading: params.heading || '',
        });

        // Remove empty params
        for (const [key, value] of Array.from(queryParams.entries())) {
          if (!value) queryParams.delete(key);
        }

        return `${baseURL}add?${queryParams.toString()}`;

      case 'show':
        return `${baseURL}show?id=${params.id}`;

      default:
        return baseURL;
    }
  }

  /**
   * Alternative: Generic REST API Wrapper
   * Adapt this based on your specific TaskFlow app's API
   */
  async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<any> {
    try {
      const response = await this.client.request({
        method,
        url: endpoint,
        data,
      });
      return response.data;
    } catch (error: any) {
      console.error(`TaskFlow API error (${method} ${endpoint}):`, error.message);
      throw error;
    }
  }
}

export default TaskFlowClient;
