import axios, { AxiosInstance } from 'axios'

const GITHUB_API_BASE = 'https://api.github.com'

let infraClient: AxiosInstance | null = null

export function getInfrastructureClient(): AxiosInstance {
  if (!infraClient) {
    const token = process.env.INFRASTRUCTURE_GITHUB_TOKEN

    infraClient = axios.create({
      baseURL: GITHUB_API_BASE,
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    })
  }

  return infraClient
}

export async function listRepos(org: string) {
  const client = getInfrastructureClient()

  try {
    const response = await client.get(`/orgs/${org}/repos`, {
      params: { per_page: 100, sort: 'updated' },
    })
    return response.data
  } catch (error) {
    console.error('Error listing infrastructure repos:', error)
    throw error
  }
}

export async function listIssues(owner: string, repo: string) {
  const client = getInfrastructureClient()

  try {
    const response = await client.get(`/repos/${owner}/${repo}/issues`, {
      params: { state: 'all', per_page: 100 },
    })
    return response.data
  } catch (error) {
    console.error('Error listing infrastructure issues:', error)
    throw error
  }
}
