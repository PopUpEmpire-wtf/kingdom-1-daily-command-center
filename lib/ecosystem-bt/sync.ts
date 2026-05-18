import { prisma } from '@/lib/prisma'
import { listEcosystemProjects, listEcosystemTasks } from './client'
import { SyncResult } from '@/types/unified'

function ecosystemStatusToTaskStatus(status: string): 'TODO' | 'IN_PROGRESS' | 'DONE' {
  const normalised = status?.toLowerCase()
  if (normalised === 'done' || normalised === 'completed' || normalised === 'closed') return 'DONE'
  if (normalised === 'in_progress' || normalised === 'in-progress' || normalised === 'active') return 'IN_PROGRESS'
  return 'TODO'
}

export async function syncEcosystemBtProjects(): Promise<SyncResult> {
  try {
    const projects = await listEcosystemProjects()
    let itemsSynced = 0

    for (const project of projects) {
      await prisma.project.upsert({
        where: {
          source_externalId: {
            source: 'ECOSYSTEM_BT',
            externalId: String(project.id),
          },
        },
        update: {
          title: project.name ?? project.title,
          description: project.description ?? null,
          status: ecosystemStatusToTaskStatus(project.status),
          updatedAt: project.updatedAt ? new Date(project.updatedAt) : new Date(),
          lastSyncAt: new Date(),
        },
        create: {
          source: 'ECOSYSTEM_BT',
          externalId: String(project.id),
          title: project.name ?? project.title,
          description: project.description ?? null,
          status: ecosystemStatusToTaskStatus(project.status),
          createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
          updatedAt: project.updatedAt ? new Date(project.updatedAt) : new Date(),
          lastSyncAt: new Date(),
        },
      })

      itemsSynced++
    }

    await prisma.syncLog.create({
      data: {
        source: 'ECOSYSTEM_BT',
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
        source: 'ECOSYSTEM_BT',
        status: 'error',
        message: `Failed to sync projects: ${message}`,
        itemsSynced: 0,
      },
    })

    return { success: false, itemsSynced: 0, errors: [message] }
  }
}

export async function syncEcosystemBtTasks(): Promise<SyncResult> {
  try {
    const projects = await listEcosystemProjects()
    let itemsSynced = 0

    for (const project of projects) {
      const tasks = await listEcosystemTasks(String(project.id))

      for (const task of tasks) {
        await prisma.task.upsert({
          where: {
            source_externalId: {
              source: 'ECOSYSTEM_BT',
              externalId: String(task.id),
            },
          },
          update: {
            title: task.name ?? task.title,
            description: task.description ?? null,
            status: ecosystemStatusToTaskStatus(task.status),
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            tags: task.tags?.length ? JSON.stringify(task.tags) : null,
            assignees: task.assignees?.length ? JSON.stringify(task.assignees) : null,
            priority: task.priority ?? null,
            updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
            lastSyncAt: new Date(),
          },
          create: {
            source: 'ECOSYSTEM_BT',
            externalId: String(task.id),
            title: task.name ?? task.title,
            description: task.description ?? null,
            status: ecosystemStatusToTaskStatus(task.status),
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            tags: task.tags?.length ? JSON.stringify(task.tags) : null,
            assignees: task.assignees?.length ? JSON.stringify(task.assignees) : null,
            priority: task.priority ?? null,
            createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
            updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
            lastSyncAt: new Date(),
          },
        })

        itemsSynced++
      }
    }

    await prisma.syncLog.create({
      data: {
        source: 'ECOSYSTEM_BT',
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
        source: 'ECOSYSTEM_BT',
        status: 'error',
        message: `Failed to sync tasks: ${message}`,
        itemsSynced: 0,
      },
    })

    return { success: false, itemsSynced: 0, errors: [message] }
  }
}

export async function syncAllEcosystemBt(): Promise<SyncResult> {
  const results = await Promise.all([
    syncEcosystemBtProjects(),
    syncEcosystemBtTasks(),
  ])

  const totalSynced = results.reduce((sum, r) => sum + r.itemsSynced, 0)
  const allSuccess = results.every(r => r.success)
  const errors = results.flatMap(r => r.errors || [])

  return {
    success: allSuccess,
    itemsSynced: totalSynced,
    errors: errors.length > 0 ? errors : undefined,
  }
}
