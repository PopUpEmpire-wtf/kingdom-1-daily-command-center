import { prisma } from '@/lib/prisma'
import { queryDatabase } from './client'
import { notionPageToUnifiedProject, notionPageToUnifiedTask } from './transforms'
import { SyncResult } from '@/types/unified'

export async function syncNotionProjects(databaseId: string): Promise<SyncResult> {
  try {
    const pages = await queryDatabase(databaseId)
    let itemsSynced = 0

    for (const page of pages) {
      const project = notionPageToUnifiedProject(page)

      await prisma.project.upsert({
        where: {
          source_externalId: {
            source: 'NOTION',
            externalId: project.externalId,
          },
        },
        update: {
          title: project.title,
          description: project.description,
          status: project.status,
          updatedAt: project.updatedAt,
          lastSyncAt: new Date(),
        },
        create: {
          source: 'NOTION',
          externalId: project.externalId,
          title: project.title,
          description: project.description,
          status: project.status,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          lastSyncAt: new Date(),
        },
      })

      itemsSynced++
    }

    await prisma.syncLog.create({
      data: {
        source: 'NOTION',
        status: 'success',
        message: 'Projects synced successfully',
        itemsSynced,
      },
    })

    return { success: true, itemsSynced }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await prisma.syncLog.create({
      data: {
        source: 'NOTION',
        status: 'error',
        message: `Failed to sync projects: ${message}`,
        itemsSynced: 0,
      },
    })

    return { success: false, itemsSynced: 0, errors: [message] }
  }
}

export async function syncNotionTasks(databaseId: string): Promise<SyncResult> {
  try {
    const pages = await queryDatabase(databaseId)
    let itemsSynced = 0

    for (const page of pages) {
      const task = notionPageToUnifiedTask(page)

      await prisma.task.upsert({
        where: {
          source_externalId: {
            source: 'NOTION',
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
          source: 'NOTION',
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

    await prisma.syncLog.create({
      data: {
        source: 'NOTION',
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
        source: 'NOTION',
        status: 'error',
        message: `Failed to sync tasks: ${message}`,
        itemsSynced: 0,
      },
    })

    return { success: false, itemsSynced: 0, errors: [message] }
  }
}

export async function syncAllNotion(): Promise<SyncResult> {
  const projectDbId = process.env.NOTION_DATABASE_ID_PROJECTS
  const taskDbId = process.env.NOTION_DATABASE_ID_TASKS

  const results: SyncResult[] = []

  if (projectDbId) {
    results.push(await syncNotionProjects(projectDbId))
  }

  if (taskDbId) {
    results.push(await syncNotionTasks(taskDbId))
  }

  const totalSynced = results.reduce((sum, r) => sum + r.itemsSynced, 0)
  const allSuccess = results.every(r => r.success)
  const errors = results.flatMap(r => r.errors || [])

  return {
    success: allSuccess,
    itemsSynced: totalSynced,
    errors: errors.length > 0 ? errors : undefined,
  }
}
