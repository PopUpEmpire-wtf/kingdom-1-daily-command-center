export interface TaskadeWorkspace {
  id: string
  name: string
}

export interface TaskadeProject {
  id: string
  name: string
  description?: string
}

export interface TaskadeTask {
  id: string
  name: string
  description?: string
  status?: string
  due?: string
  tags?: string[]
  assignees?: string[]
  priority?: string
  createdAt: string
  updatedAt: string
}

export interface TaskadeWebhookEvent {
  event: 'task.created' | 'task.updated' | 'task.deleted' | 'project.updated'
  data: any
  timestamp: string
}
