import axios, { AxiosInstance } from 'axios'

const TASKADE_API_BASE = 'https://www.taskade.com/api/v1'

let taskadeClient: AxiosInstance | null = null

export function getTaskadeClient(): AxiosInstance {
  if (!taskadeClient) {
    const apiToken = process.env.TASKADE_API_TOKEN

    if (!apiToken) {
      throw new Error('TASKADE_API_TOKEN is not configured')
    }

    taskadeClient = axios.create({
      baseURL: TASKADE_API_BASE,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    })
  }

  return taskadeClient
}

export async function listWorkspaces() {
  const client = getTaskadeClient()

  try {
    const response = await client.get('/workspaces')
    return response.data
  } catch (error) {
    console.error('Error listing Taskade workspaces:', error)
    throw error
  }
}

export async function listProjects(workspaceId: string) {
  const client = getTaskadeClient()

  try {
    const response = await client.get(`/workspaces/${workspaceId}/projects`)
    return response.data
  } catch (error) {
    console.error('Error listing Taskade projects:', error)
    throw error
  }
}

export async function listTasks(projectId: string, cursor?: string) {
  const client = getTaskadeClient()

  try {
    const params: any = {}
    if (cursor) params.cursor = cursor

    const response = await client.get(`/projects/${projectId}/tasks`, { params })
    return response.data
  } catch (error) {
    console.error('Error listing Taskade tasks:', error)
    throw error
  }
}

export async function getTask(taskId: string) {
  const client = getTaskadeClient()

  try {
    const response = await client.get(`/tasks/${taskId}`)
    return response.data
  } catch (error) {
    console.error('Error getting Taskade task:', error)
    throw error
  }
}

export async function createTask(projectId: string, task: any) {
  const client = getTaskadeClient()

  try {
    const response = await client.post(`/projects/${projectId}/tasks`, task)
    return response.data
  } catch (error) {
    console.error('Error creating Taskade task:', error)
    throw error
  }
}

export async function updateTask(taskId: string, updates: any) {
  const client = getTaskadeClient()

  try {
    const response = await client.patch(`/tasks/${taskId}`, updates)
    return response.data
  } catch (error) {
    console.error('Error updating Taskade task:', error)
    throw error
  }
}

export async function deleteTask(taskId: string) {
  const client = getTaskadeClient()

  try {
    await client.delete(`/tasks/${taskId}`)
  } catch (error) {
    console.error('Error deleting Taskade task:', error)
    throw error
  }
}
