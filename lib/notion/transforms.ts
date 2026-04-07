import { UnifiedProject, UnifiedTask, TaskStatus } from '@/types/unified'

export function notionStatusToUnified(status: string): TaskStatus {
  const statusMap: Record<string, TaskStatus> = {
    'not started': 'TODO',
    'to do': 'TODO',
    'todo': 'TODO',
    'in progress': 'IN_PROGRESS',
    'doing': 'IN_PROGRESS',
    'done': 'DONE',
    'completed': 'DONE',
  }

  return statusMap[status.toLowerCase()] || 'TODO'
}

export function unifiedStatusToNotion(status: TaskStatus): string {
  const statusMap: Record<TaskStatus, string> = {
    'TODO': 'To Do',
    'IN_PROGRESS': 'In Progress',
    'DONE': 'Done',
  }

  return statusMap[status]
}

export function notionPageToUnifiedProject(page: any): UnifiedProject {
  const properties = page.properties || {}

  // Extract title
  const titleProp = properties.Name || properties.Title || properties.title
  const title = titleProp?.title?.[0]?.plain_text || 'Untitled'

  // Extract status
  const statusProp = properties.Status || properties.status
  const status = statusProp?.select?.name || statusProp?.status?.name || 'To Do'

  // Extract description
  const descProp = properties.Description || properties.description
  const description = descProp?.rich_text?.[0]?.plain_text

  return {
    id: `notion_${page.id}`,
    source: 'NOTION',
    externalId: page.id,
    title,
    description,
    status: notionStatusToUnified(status),
    createdAt: new Date(page.created_time),
    updatedAt: new Date(page.last_edited_time),
    lastSyncAt: new Date(),
  }
}

export function notionPageToUnifiedTask(page: any): UnifiedTask {
  const properties = page.properties || {}

  // Extract title
  const titleProp = properties.Name || properties.Title || properties.title
  const title = titleProp?.title?.[0]?.plain_text || 'Untitled'

  // Extract status
  const statusProp = properties.Status || properties.status
  const status = statusProp?.select?.name || statusProp?.status?.name || 'To Do'

  // Extract description
  const descProp = properties.Description || properties.description
  const description = descProp?.rich_text?.[0]?.plain_text

  // Extract due date
  const dueProp = properties['Due Date'] || properties.due || properties.date
  const dueDate = dueProp?.date?.start ? new Date(dueProp.date.start) : undefined

  // Extract tags
  const tagsProp = properties.Tags || properties.tags
  const tags = tagsProp?.multi_select?.map((t: any) => t.name) || []

  // Extract priority
  const priorityProp = properties.Priority || properties.priority
  const priority = priorityProp?.select?.name

  return {
    id: `notion_${page.id}`,
    source: 'NOTION',
    externalId: page.id,
    title,
    description,
    status: notionStatusToUnified(status),
    dueDate,
    tags,
    priority,
    createdAt: new Date(page.created_time),
    updatedAt: new Date(page.last_edited_time),
    lastSyncAt: new Date(),
  }
}

export function unifiedProjectToNotionProperties(project: Partial<UnifiedProject>) {
  const properties: any = {}

  if (project.title) {
    properties.Name = {
      title: [{ text: { content: project.title } }],
    }
  }

  if (project.description) {
    properties.Description = {
      rich_text: [{ text: { content: project.description } }],
    }
  }

  if (project.status) {
    properties.Status = {
      select: { name: unifiedStatusToNotion(project.status) },
    }
  }

  return properties
}

export function unifiedTaskToNotionProperties(task: Partial<UnifiedTask>) {
  const properties: any = {}

  if (task.title) {
    properties.Name = {
      title: [{ text: { content: task.title } }],
    }
  }

  if (task.description) {
    properties.Description = {
      rich_text: [{ text: { content: task.description } }],
    }
  }

  if (task.status) {
    properties.Status = {
      select: { name: unifiedStatusToNotion(task.status) },
    }
  }

  if (task.dueDate) {
    properties['Due Date'] = {
      date: { start: task.dueDate.toISOString() },
    }
  }

  if (task.tags && task.tags.length > 0) {
    properties.Tags = {
      multi_select: task.tags.map(tag => ({ name: tag })),
    }
  }

  if (task.priority) {
    properties.Priority = {
      select: { name: task.priority },
    }
  }

  return properties
}
