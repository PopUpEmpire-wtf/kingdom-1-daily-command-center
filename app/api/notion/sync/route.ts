import { NextResponse } from 'next/server'
import { syncAllNotion } from '@/lib/notion/sync'

export async function POST() {
  try {
    const result = await syncAllNotion()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Notion sync error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync Notion data' },
      { status: 500 }
    )
  }
}
