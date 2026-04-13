import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Crisis Mode - Emergency triage and prioritization
 * Returns critical items requiring immediate attention
 */

const crisisModeSchema = z.object({
  includeContext: z.boolean().optional().default(true),
  maxItems: z.number().optional().default(10),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const params = crisisModeSchema.parse(body);

    const now = new Date();

    // Find critical items
    const [
      overdueHighPriority,
      blockedTasks,
      failedSyncs,
      dueTodayHighPriority,
      stuckProjects,
    ] = await Promise.all([
      // Overdue high priority tasks
      prisma.task.findMany({
        where: {
          status: { not: 'DONE' },
          priority: 'HIGH',
          dueDate: { lt: now },
        },
        orderBy: {
          dueDate: 'asc',
        },
        take: params.maxItems,
      }),

      // Tasks marked as blocked
      prisma.task.findMany({
        where: {
          status: 'BLOCKED',
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 5,
      }),

      // Recent sync failures
      prisma.syncLog.findMany({
        where: {
          status: 'ERROR',
          timestamp: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24h
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 5,
      }),

      // High priority due today
      prisma.task.findMany({
        where: {
          status: { not: 'DONE' },
          priority: 'HIGH',
          dueDate: {
            gte: new Date(now.setHours(0, 0, 0, 0)),
            lte: new Date(now.setHours(23, 59, 59, 999)),
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
        take: 5,
      }),

      // Projects not updated in 7+ days but still in progress
      prisma.project.findMany({
        where: {
          status: 'IN_PROGRESS',
          updatedAt: {
            lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          updatedAt: 'asc',
        },
        take: 5,
      }),
    ]);

    // Calculate crisis severity
    const criticalCount =
      overdueHighPriority.length +
      blockedTasks.length +
      failedSyncs.length;

    let crisisLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
    let crisisColor: string;
    let primaryAction: string;

    if (criticalCount === 0) {
      crisisLevel = 'none';
      crisisColor = 'green';
      primaryAction = 'No immediate crisis. Review routine tasks.';
    } else if (criticalCount <= 2) {
      crisisLevel = 'low';
      crisisColor = 'yellow';
      primaryAction = 'Minor issues detected. Address overdue items.';
    } else if (criticalCount <= 5) {
      crisisLevel = 'medium';
      crisisColor = 'orange';
      primaryAction = 'Multiple urgent items. Prioritize high-priority tasks.';
    } else if (criticalCount <= 10) {
      crisisLevel = 'high';
      crisisColor = 'red';
      primaryAction = 'High crisis level. Focus on overdue and blocked tasks immediately.';
    } else {
      crisisLevel = 'critical';
      crisisColor = 'darkred';
      primaryAction = 'CRITICAL: Emergency triage needed. Clear overdue tasks and resolve blockers.';
    }

    // Generate action plan
    const actionPlan = [];

    if (overdueHighPriority.length > 0) {
      actionPlan.push({
        priority: 1,
        action: `Complete ${overdueHighPriority.length} overdue high-priority task(s)`,
        items: overdueHighPriority.slice(0, 3).map(t => t.title),
      });
    }

    if (blockedTasks.length > 0) {
      actionPlan.push({
        priority: 2,
        action: `Unblock ${blockedTasks.length} blocked task(s)`,
        items: blockedTasks.slice(0, 3).map(t => t.title),
      });
    }

    if (failedSyncs.length > 0) {
      actionPlan.push({
        priority: 3,
        action: `Resolve ${failedSyncs.length} sync failure(s)`,
        items: failedSyncs.map(s => `${s.source}: ${s.message}`),
      });
    }

    if (stuckProjects.length > 0) {
      actionPlan.push({
        priority: 4,
        action: `Review ${stuckProjects.length} stale project(s)`,
        items: stuckProjects.slice(0, 3).map(p => p.title),
      });
    }

    const response = {
      success: true,
      data: {
        crisisLevel,
        color: crisisColor,
        criticalCount,
        primaryAction,
        actionPlan,
        criticalItems: {
          overdueHighPriority: overdueHighPriority.map(t => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate,
            status: t.status,
            source: t.source,
            daysOverdue: Math.floor(
              (now.getTime() - (t.dueDate?.getTime() || now.getTime())) / (24 * 60 * 60 * 1000)
            ),
          })),
          blockedTasks: blockedTasks.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            source: t.source,
          })),
          failedSyncs: failedSyncs.map(s => ({
            source: s.source,
            message: s.message,
            timestamp: s.timestamp,
          })),
        },
        ...(params.includeContext && {
          context: {
            dueTodayHighPriority: dueTodayHighPriority.map(t => ({
              id: t.id,
              title: t.title,
              dueDate: t.dueDate,
            })),
            stuckProjects: stuckProjects.map(p => ({
              id: p.id,
              title: p.title,
              updatedAt: p.updatedAt,
              daysSinceUpdate: Math.floor(
                (now.getTime() - p.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
              ),
            })),
          },
        }),
      },
      timestamp: now.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Crisis Mode error:', error);
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
