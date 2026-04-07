import { NextResponse } from 'next/server'
import { syncAllTaskade } from '@/lib/taskade/sync'

export async function POST() {
  try {
    const result = await syncAllTaskade()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Taskade sync error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync Taskade data' },
      { status: 500 }
    )
  }
}
