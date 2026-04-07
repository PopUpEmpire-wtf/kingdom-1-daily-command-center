import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { taskadeTaskToUnified } from '@/lib/taskade/transforms'
import { TaskadeWebhookEvent } from '@/types/taskade'

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.TASKADE_WEBHOOK_SECRET

    // Verify webhook signature if configured
    if (webhookSecret) {
      const signature = request.headers.get('x-taskade-signature')
      // TODO: Implement signature verification when Taskade provides it
    }

    const event: TaskadeWebhookEvent = await request.json()

    console.log('Received Taskade webhook:', event.event)

    switch (event.event) {
      case 'task.created':
      case 'task.updated':
        const task = taskadeTaskToUnified(event.data)

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
        break

      case 'task.deleted':
        await prisma.task.delete({
          where: {
            source_externalId: {
              source: 'TASKADE',
              externalId: event.data.id,
            },
          },
        })
        break

      default:
        console.log('Unhandled webhook event:', event.event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}
