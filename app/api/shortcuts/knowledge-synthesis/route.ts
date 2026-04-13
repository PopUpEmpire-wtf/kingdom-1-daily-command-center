import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Knowledge Synthesis - Aggregate and connect information across projects
 * Returns insights, patterns, and cross-project connections
 */

const knowledgeSynthesisSchema = z.object({
  timeframe: z.enum(['day', 'week', 'month']).optional().default('week'),
  includeArchived: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const params = knowledgeSynthesisSchema.parse(body);

    // Calculate date range based on timeframe
    const now = new Date();
    const startDate = new Date();

    switch (params.timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // Fetch recent projects with their tasks
    const projects = await prisma.project.findMany({
      where: {
        updatedAt: {
          gte: startDate,
        },
        ...(params.includeArchived ? {} : { status: { not: 'DONE' } }),
      },
      include: {
        tasks: {
          where: {
            updatedAt: {
              gte: startDate,
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Analyze patterns
    const patterns = {
      totalProjects: projects.length,
      totalTasks: projects.reduce((sum, p) => sum + p.tasks.length, 0),
      completedTasks: projects.reduce(
        (sum, p) => sum + p.tasks.filter(t => t.status === 'DONE').length,
        0
      ),
      bySource: {
        notion: projects.filter(p => p.source === 'NOTION').length,
        taskade: projects.filter(p => p.source === 'TASKADE').length,
      },
      byStatus: {
        todo: projects.filter(p => p.status === 'TODO').length,
        inProgress: projects.filter(p => p.status === 'IN_PROGRESS').length,
        done: projects.filter(p => p.status === 'DONE').length,
      },
    };

    // Generate insights
    const insights = [];

    const completionRate = patterns.totalTasks > 0
      ? (patterns.completedTasks / patterns.totalTasks) * 100
      : 0;

    if (completionRate > 75) {
      insights.push({
        type: 'positive',
        message: `High completion rate: ${completionRate.toFixed(1)}% of tasks completed`,
      });
    } else if (completionRate < 25) {
      insights.push({
        type: 'warning',
        message: `Low completion rate: Only ${completionRate.toFixed(1)}% of tasks completed`,
      });
    }

    if (patterns.byStatus.inProgress > 5) {
      insights.push({
        type: 'info',
        message: `${patterns.byStatus.inProgress} projects in progress - consider focusing efforts`,
      });
    }

    // Find related projects (projects updated around the same time)
    const connections = projects
      .slice(0, 10)
      .map(project => ({
        projectId: project.id,
        title: project.title,
        relatedProjects: projects
          .filter(p => {
            if (p.id === project.id) return false;
            const timeDiff = Math.abs(
              p.updatedAt.getTime() - project.updatedAt.getTime()
            );
            return timeDiff < 24 * 60 * 60 * 1000; // Within 24 hours
          })
          .map(p => ({ id: p.id, title: p.title }))
          .slice(0, 3),
      }))
      .filter(c => c.relatedProjects.length > 0);

    const response = {
      success: true,
      data: {
        timeframe: params.timeframe,
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString(),
        },
        patterns,
        insights,
        connections,
        topProjects: projects.slice(0, 5).map(p => ({
          id: p.id,
          title: p.title,
          status: p.status,
          source: p.source,
          taskCount: p.tasks.length,
          updatedAt: p.updatedAt,
        })),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Knowledge Synthesis error:', error);
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
