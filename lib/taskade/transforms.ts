import { UnifiedTask, TaskStatus } from '@/types/unified'
import { TaskadeTask } from '@/types/taskade'

export function taskadeStatusToUnified(status?: string): TaskStatus {
  if (!status) return 'TODO'

  const statusMap: Record<string, TaskStatus> = {
    'todo': 'TODO',
    'in_progress': 'IN_PROGRESS',
    'in progress': 'IN_PROGRESS',
    'doing': 'IN_PROGRESS',
    'done': 'DONE',
    'completed': 'DONE',
  }

  return statusMap[status.toLowerCase()] || 'TODO'
}

export function unifiedStatusToTaskade(status: TaskStatus): string {
  const statusMap: Record<TaskStatus, string> = {
    'TODO': 'todo',
    'IN_PROGRESS': 'in_progress',
    'DONE': 'done',
  }

  return statusMap[status]
}

export function taskadeTaskToUnified(task: TaskadeTask): UnifiedTask {
  return {
    id: `taskade_${task.id}`,
    source: 'TASKADE',
    externalId: task.id,
    title: task.name,
    description: task.description,
    status: taskadeStatusToUnified(task.status),
    dueDate: task.due ? new Date(task.due) : undefined,
    tags: task.tags || [],
    assignees: task.assignees || [],
    priority: task.priority,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
    lastSyncAt: new Date(),
  }
}

export function unifiedTaskToTaskadeUpdate(task: Partial<UnifiedTask>) {
  const update: any = {}

  if (task.title) update.name = task.title
  if (task.description !== undefined) update.description = task.description
  if (task.status) update.status = unifiedStatusToTaskade(task.status)
  if (task.dueDate) update.due = task.dueDate.toISOString()
  if (task.tags) update.tags = task.tags
  if (task.assignees) update.assignees = task.assignees
  if (task.priority) update.priority = task.priority

  return update
}
