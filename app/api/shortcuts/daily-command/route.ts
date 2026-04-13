import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Daily Command - Trigger daily planning workflow
 * Returns today's tasks, upcoming events, and action items
 */

const dailyCommandSchema = z.object({
  date: z.string().optional(), // ISO date string, defaults to today
  includeStats: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const params = dailyCommandSchema.parse(body);

    const targetDate = params.date ? new Date(params.date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Fetch today's tasks
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { status: 'TODO' },
          { status: 'IN_PROGRESS' },
        ],
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
      take: 20,
    });

    // Fetch upcoming events
    const events = await prisma.calendarEvent.findMany({
      where: {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Fetch active projects
    const activeProjects = await prisma.project.findMany({
      where: {
        status: 'IN_PROGRESS',
      },
      take: 5,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Generate daily summary
    const summary = {
      date: targetDate.toISOString().split('T')[0],
      totalTasks: tasks.length,
      highPriorityTasks: tasks.filter(t => t.priority === 'HIGH').length,
      totalEvents: events.length,
      activeProjects: activeProjects.length,
    };

    const response = {
      success: true,
      data: {
        summary,
        tasks: tasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          source: t.source,
          dueDate: t.dueDate,
          projectId: t.projectId,
        })),
        events: events.map(e => ({
          id: e.id,
          title: e.title,
          startTime: e.startTime,
          endTime: e.endTime,
          source: e.source,
        })),
        projects: activeProjects.map(p => ({
          id: p.id,
          title: p.title,
          status: p.status,
          source: p.source,
        })),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Daily Command error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Allow GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}
