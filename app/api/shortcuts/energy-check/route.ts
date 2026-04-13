import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Energy Check - Quick status check across all systems
 * Returns system health, sync status, and workload metrics
 */

const energyCheckSchema = z.object({
  detailed: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const params = energyCheckSchema.parse(body);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check sync status
    const recentSyncLogs = await prisma.syncLog.findMany({
      where: {
        timestamp: {
          gte: oneHourAgo,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
    });

    const lastNotionSync = recentSyncLogs.find(log => log.source === 'NOTION');
    const lastTaskadeSync = recentSyncLogs.find(log => log.source === 'TASKADE');

    // Get workload metrics
    const [
      totalTasks,
      todoTasks,
      inProgressTasks,
      overdueTasks,
      totalProjects,
      activeProjects,
    ] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { status: 'TODO' } }),
      prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.task.count({
        where: {
          status: { not: 'DONE' },
          dueDate: { lt: now },
        },
      }),
      prisma.project.count(),
      prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
    ]);

    // Recent activity
    const recentActivity = await prisma.task.findMany({
      where: {
        updatedAt: {
          gte: oneDayAgo,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    });

    // Calculate health score (0-100)
    let healthScore = 100;

    // Penalize for sync issues
    if (!lastNotionSync || (now.getTime() - lastNotionSync.timestamp.getTime()) > 5 * 60 * 1000) {
      healthScore -= 20; // No sync in last 5 minutes
    }
    if (lastNotionSync?.status === 'ERROR') healthScore -= 15;
    if (lastTaskadeSync?.status === 'ERROR') healthScore -= 15;

    // Penalize for overdue tasks
    if (overdueTasks > 0) {
      healthScore -= Math.min(overdueTasks * 5, 30);
    }

    // Penalize for too many active items
    if (activeProjects > 10) healthScore -= 10;
    if (inProgressTasks > 20) healthScore -= 10;

    healthScore = Math.max(0, healthScore);

    // Determine energy level
    let energyLevel: 'high' | 'medium' | 'low' | 'critical';
    let energyColor: string;
    let recommendation: string;

    if (healthScore >= 80) {
      energyLevel = 'high';
      energyColor = 'green';
      recommendation = 'Systems running smoothly. Good time for deep work.';
    } else if (healthScore >= 60) {
      energyLevel = 'medium';
      energyColor = 'yellow';
      recommendation = 'Minor issues detected. Consider reviewing sync status.';
    } else if (healthScore >= 40) {
      energyLevel = 'low';
      energyColor = 'orange';
      recommendation = 'Multiple issues detected. Address overdue tasks and sync errors.';
    } else {
      energyLevel = 'critical';
      energyColor = 'red';
      recommendation = 'Critical issues. Immediate attention required.';
    }

    const response = {
      success: true,
      data: {
        energyLevel,
        healthScore,
        color: energyColor,
        recommendation,
        metrics: {
          tasks: {
            total: totalTasks,
            todo: todoTasks,
            inProgress: inProgressTasks,
            overdue: overdueTasks,
          },
          projects: {
            total: totalProjects,
            active: activeProjects,
          },
        },
        syncStatus: {
          notion: {
            lastSync: lastNotionSync?.timestamp || null,
            status: lastNotionSync?.status || 'UNKNOWN',
            healthy: lastNotionSync?.status === 'SUCCESS',
          },
          taskade: {
            lastSync: lastTaskadeSync?.timestamp || null,
            status: lastTaskadeSync?.status || 'UNKNOWN',
            healthy: lastTaskadeSync?.status === 'SUCCESS',
          },
        },
        ...(params.detailed && {
          recentActivity: recentActivity.map(a => ({
            id: a.id,
            title: a.title,
            status: a.status,
            updatedAt: a.updatedAt,
          })),
          recentSyncs: recentSyncLogs.map(s => ({
            source: s.source,
            status: s.status,
            timestamp: s.timestamp,
            message: s.message,
          })),
        }),
      },
      timestamp: now.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Energy Check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
