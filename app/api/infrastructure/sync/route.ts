import { NextResponse } from 'next/server'
import { syncAllInfrastructure } from '@/lib/infrastructure/sync'

export async function POST() {
  try {
    const result = await syncAllInfrastructure()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Infrastructure sync error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync infrastructure data' },
      { status: 500 }
    )
  }
}
