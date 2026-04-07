import { NextRequest, NextResponse } from 'next/server'
import { getAllTasks, getTasksByStatus } from '@/lib/unified/aggregator'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const source = searchParams.get('source') as 'NOTION' | 'TASKADE' | null
    const status = searchParams.get('status')

    let tasks

    if (status) {
      tasks = await getTasksByStatus(status)
    } else {
      tasks = await getAllTasks(source || undefined)
    }

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching unified tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
