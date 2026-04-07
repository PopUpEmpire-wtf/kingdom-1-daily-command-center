import { prisma } from '@/lib/prisma'
import { listProjects, listTasks } from './client'
import { taskadeTaskToUnified } from './transforms'
import { SyncResult } from '@/types/unified'

export async function syncTaskadeTasks(workspaceId: string): Promise<SyncResult> {
  try {
    const projects = await listProjects(workspaceId)
    let itemsSynced = 0

    for (const project of projects) {
      let cursor: string | undefined
      let hasMore = true

      while (hasMore) {
        const response = await listTasks(project.id, cursor)
        const tasks = response.tasks || response.data || []

        for (const taskadeTask of tasks) {
          const task = taskadeTaskToUnified(taskadeTask)

          await prisma.task.upsert({
            where: {
              source_externalId: {
                source: 'TASKADE',
                externalId: task.externalId,
              },
            },
            update: {
              title: task.title,
              description: task.description,
              status: task.status,
              dueDate: task.dueDate,
              tags: task.tags ? JSON.stringify(task.tags) : null,
              assignees: task.assignees ? JSON.stringify(task.assignees) : null,
              priority: task.priority,
              updatedAt: task.updatedAt,
              lastSyncAt: new Date(),
            },
            create: {
              source: 'TASKADE',
              externalId: task.externalId,
              title: task.title,
              description: task.description,
              status: task.status,
              dueDate: task.dueDate,
              tags: task.tags ? JSON.stringify(task.tags) : null,
              assignees: task.assignees ? JSON.stringify(task.assignees) : null,
              priority: task.priority,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
              lastSyncAt: new Date(),
            },
          })

          itemsSynced++
        }

        cursor = response.nextCursor || response.next_cursor
        hasMore = !!cursor
      }
    }

    await prisma.syncLog.create({
      data: {
        source: 'TASKADE',
        status: 'success',
        message: 'Tasks synced successfully',
        itemsSynced,
      },
    })

    return { success: true, itemsSynced }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await prisma.syncLog.create({
      data: {
        source: 'TASKADE',
        status: 'error',
        message: `Failed to sync tasks: ${message}`,
        itemsSynced: 0,
      },
    })

    return { success: false, itemsSynced: 0, errors: [message] }
  }
}

export async function syncAllTaskade(): Promise<SyncResult> {
  const workspaceId = process.env.TASKADE_WORKSPACE_ID

  if (!workspaceId) {
    return {
      success: false,
      itemsSynced: 0,
      errors: ['TASKADE_WORKSPACE_ID is not configured'],
    }
  }

  return await syncTaskadeTasks(workspaceId)
}
