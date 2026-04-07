export type DataSource = 'NOTION' | 'TASKADE'

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

export interface UnifiedProject {
  id: string
  source: DataSource
  externalId: string
  title: string
  description?: string
  status: TaskStatus
  createdAt: Date
  updatedAt: Date
  lastSyncAt: Date
  tasks?: UnifiedTask[]
}

export interface UnifiedTask {
  id: string
  source: DataSource
  externalId: string
  title: string
  description?: string
  status: TaskStatus
  dueDate?: Date
  tags?: string[]
  assignees?: string[]
  priority?: string
  createdAt: Date
  updatedAt: Date
  lastSyncAt: Date
  projectId?: string
}

export interface UnifiedCalendarEvent {
  id: string
  source: DataSource
  externalId: string
  title: string
  description?: string
  startDate: Date
  endDate?: Date
  allDay: boolean
  createdAt: Date
  updatedAt: Date
  lastSyncAt: Date
}

export interface SyncResult {
  success: boolean
  itemsSynced: number
  errors?: string[]
}
