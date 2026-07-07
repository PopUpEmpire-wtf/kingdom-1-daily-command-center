import { prisma } from '@/lib/prisma'
import { UnifiedProject, UnifiedTask, DataSource } from '@/types/unified'

export async function getAllProjects(source?: DataSource): Promise<UnifiedProject[]> {
  const where = source ? { source } : {}

  const projects = await prisma.project.findMany({
    where,
    include: {
      tasks: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return projects.map(project => ({
    ...project,
    tasks: project.tasks?.map(task => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
      assignees: task.assignees ? JSON.parse(task.assignees) : [],
    })),
  }))
}

export async function getAllTasks(source?: DataSource): Promise<UnifiedTask[]> {
  const where = source ? { source } : {}

  const tasks = await prisma.task.findMany({
    where,
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return tasks.map(task => ({
    ...task,
    tags: task.tags ? JSON.parse(task.tags) : [],
    assignees: task.assignees ? JSON.parse(task.assignees) : [],
  }))
}

export async function getProjectById(id: string): Promise<UnifiedProject | null> {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: true,
    },
  })

  if (!project) return null

  return {
    ...project,
    tasks: project.tasks?.map(task => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
      assignees: task.assignees ? JSON.parse(task.assignees) : [],
    })),
  }
}

export async function getTaskById(id: string): Promise<UnifiedTask | null> {
  const task = await prisma.task.findUnique({
    where: { id },
  })

  if (!task) return null

  return {
    ...task,
    tags: task.tags ? JSON.parse(task.tags) : [],
    assignees: task.assignees ? JSON.parse(task.assignees) : [],
  }
}

export async function getProjectsByStatus(status: string) {
  const projects = await prisma.project.findMany({
    where: {
      status: status as any,
    },
    include: {
      tasks: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return projects.map(project => ({
    ...project,
    tasks: project.tasks?.map(task => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
      assignees: task.assignees ? JSON.parse(task.assignees) : [],
    })),
  }))
}

export async function getTasksByStatus(status: string) {
  const tasks = await prisma.task.findMany({
    where: {
      status: status as any,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return tasks.map(task => ({
    ...task,
    tags: task.tags ? JSON.parse(task.tags) : [],
    assignees: task.assignees ? JSON.parse(task.assignees) : [],
  }))
}

export async function getStats() {
  const [
    totalProjects,
    totalTasks,
    notionProjects,
    taskadeProjects,
    infrastructureProjects,
    ecosystemBtProjects,
    notionTasks,
    taskadeTasks,
    infrastructureTasks,
    ecosystemBtTasks,
    todoTasks,
    inProgressTasks,
    doneTasks,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.task.count(),
    prisma.project.count({ where: { source: 'NOTION' } }),
    prisma.project.count({ where: { source: 'TASKADE' } }),
    prisma.project.count({ where: { source: 'INFRASTRUCTURE' } }),
    prisma.project.count({ where: { source: 'ECOSYSTEM_BT' } }),
    prisma.task.count({ where: { source: 'NOTION' } }),
    prisma.task.count({ where: { source: 'TASKADE' } }),
    prisma.task.count({ where: { source: 'INFRASTRUCTURE' } }),
    prisma.task.count({ where: { source: 'ECOSYSTEM_BT' } }),
    prisma.task.count({ where: { status: 'TODO' } }),
    prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { status: 'DONE' } }),
  ])

  return {
    totalProjects,
    totalTasks,
    bySource: {
      notion: { projects: notionProjects, tasks: notionTasks },
      taskade: { projects: taskadeProjects, tasks: taskadeTasks },
      infrastructure: { projects: infrastructureProjects, tasks: infrastructureTasks },
      ecosystemBt: { projects: ecosystemBtProjects, tasks: ecosystemBtTasks },
    },
    byStatus: {
      todo: todoTasks,
      inProgress: inProgressTasks,
      done: doneTasks,
    },
  }
}
