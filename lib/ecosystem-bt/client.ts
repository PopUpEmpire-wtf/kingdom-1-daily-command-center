import axios, { AxiosInstance } from 'axios'

const ECOSYSTEM_BT_API_BASE = process.env.ECOSYSTEM_BT_API_URL || 'https://api.ecosystem-bt.internal'

let ecosystemBtClient: AxiosInstance | null = null

export function getEcosystemBtClient(): AxiosInstance {
  if (!ecosystemBtClient) {
    const apiKey = process.env.ECOSYSTEM_BT_API_KEY

    if (!apiKey) {
      throw new Error('ECOSYSTEM_BT_API_KEY is not configured')
    }

    ecosystemBtClient = axios.create({
      baseURL: ECOSYSTEM_BT_API_BASE,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
  }

  return ecosystemBtClient
}

export async function listEcosystemProjects() {
  const client = getEcosystemBtClient()

  try {
    const response = await client.get('/projects')
    return response.data
  } catch (error) {
    console.error('Error listing Ecosystem-BT projects:', error)
    throw error
  }
}

export async function listEcosystemTasks(projectId: string) {
  const client = getEcosystemBtClient()

  try {
    const response = await client.get(`/projects/${projectId}/tasks`)
    return response.data
  } catch (error) {
    console.error('Error listing Ecosystem-BT tasks:', error)
    throw error
  }
}

export async function updateEcosystemTask(taskId: string, updates: Record<string, unknown>) {
  const client = getEcosystemBtClient()

  try {
    const response = await client.patch(`/tasks/${taskId}`, updates)
    return response.data
  } catch (error) {
    console.error('Error updating Ecosystem-BT task:', error)
    throw error
  }
}
