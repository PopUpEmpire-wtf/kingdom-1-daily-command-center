import { prisma } from '@/lib/prisma'
import { listRepos, listIssues } from './client'
import { SyncResult } from '@/types/unified'

function githubStatusToTaskStatus(state: string): 'TODO' | 'IN_PROGRESS' | 'DONE' {
  if (state === 'closed') return 'DONE'
  return 'TODO'
}

export async function syncInfrastructureProjects(): Promise<SyncResult> {
  const org = process.env.INFRASTRUCTURE_GITHUB_ORG

  if (!org) {
    return { success: false, itemsSynced: 0, errors: ['INFRASTRUCTURE_GITHUB_ORG is not configured'] }
  }

  try {
    const repos = await listRepos(org)
    let itemsSynced = 0

    for (const repo of repos) {
      await prisma.project.upsert({
        where: {
          source_externalId: {
            source: 'INFRASTRUCTURE',
            externalId: String(repo.id),
          },
        },
        update: {
          title: repo.full_name,
          description: repo.description ?? null,
          status: repo.archived ? 'DONE' : 'TODO',
          updatedAt: new Date(repo.updated_at),
          lastSyncAt: new Date(),
        },
        create: {
          source: 'INFRASTRUCTURE',
          externalId: String(repo.id),
          title: repo.full_name,
          description: repo.description ?? null,
          status: repo.archived ? 'DONE' : 'TODO',
          createdAt: new Date(repo.created_at),
          updatedAt: new Date(repo.updated_at),
          lastSyncAt: new Date(),
        },
      })

      itemsSynced++
    }

    await prisma.syncLog.create({
      data: {
        source: 'INFRASTRUCTURE',
        status: 'success',
        message: 'Repos synced successfully',
        itemsSynced,
      },
    })

    return { success: true, itemsSynced }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await prisma.syncLog.create({
      data: {
        source: 'INFRASTRUCTURE',
        status: 'error',
        message: `Failed to sync repos: ${message}`,
        itemsSynced: 0,
      },
    })

    return { success: false, itemsSynced: 0, errors: [message] }
  }
}

export async function syncInfrastructureTasks(): Promise<SyncResult> {
  const org = process.env.INFRASTRUCTURE_GITHUB_ORG
  const repos = process.env.INFRASTRUCTURE_GITHUB_REPOS?.split(',').map(r => r.trim()).filter(Boolean)

  if (!org || !repos?.length) {
    return { success: false, itemsSynced: 0, errors: ['INFRASTRUCTURE_GITHUB_ORG or INFRASTRUCTURE_GITHUB_REPOS is not configured'] }
  }

  try {
    let itemsSynced = 0

    for (const repo of repos) {
      const issues = await listIssues(org, repo)

      for (const issue of issues) {
        await prisma.task.upsert({
          where: {
            source_externalId: {
              source: 'INFRASTRUCTURE',
              externalId: String(issue.id),
            },
          },
          update: {
            title: issue.title,
            description: issue.body ?? null,
            status: githubStatusToTaskStatus(issue.state),
            tags: issue.labels?.length ? JSON.stringify(issue.labels.map((l: { name: string }) => l.name)) : null,
            assignees: issue.assignees?.length ? JSON.stringify(issue.assignees.map((a: { login: string }) => a.login)) : null,
            updatedAt: new Date(issue.updated_at),
            lastSyncAt: new Date(),
          },
          create: {
            source: 'INFRASTRUCTURE',
            externalId: String(issue.id),
            title: issue.title,
            description: issue.body ?? null,
            status: githubStatusToTaskStatus(issue.state),
            tags: issue.labels?.length ? JSON.stringify(issue.labels.map((l: { name: string }) => l.name)) : null,
            assignees: issue.assignees?.length ? JSON.stringify(issue.assignees.map((a: { login: string }) => a.login)) : null,
            createdAt: new Date(issue.created_at),
            updatedAt: new Date(issue.updated_at),
            lastSyncAt: new Date(),
          },
        })

        itemsSynced++
      }
    }

    await prisma.syncLog.create({
      data: {
        source: 'INFRASTRUCTURE',
        status: 'success',
        message: 'Issues synced successfully',
        itemsSynced,
      },
    })

    return { success: true, itemsSynced }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    await prisma.syncLog.create({
      data: {
        source: 'INFRASTRUCTURE',
        status: 'error',
        message: `Failed to sync issues: ${message}`,
        itemsSynced: 0,
      },
    })

    return { success: false, itemsSynced: 0, errors: [message] }
  }
}

export async function syncAllInfrastructure(): Promise<SyncResult> {
  const results = await Promise.all([
    syncInfrastructureProjects(),
    syncInfrastructureTasks(),
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
