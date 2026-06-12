import { NextRequest, NextResponse } from 'next/server'
import { syncAllEcosystemBt } from '@/lib/ecosystem-bt/sync'

export async function POST(request: NextRequest) {
  try {
    const syncSecret = process.env.INTERNAL_SYNC_SECRET
    if (!syncSecret) {
      return NextResponse.json(
        { success: false, error: 'INTERNAL_SYNC_SECRET is not configured' },
        { status: 500 }
      )
    }

    const providedSecret = request.headers.get('x-sync-secret')
    if (providedSecret !== syncSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await syncAllEcosystemBt()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Ecosystem-BT sync error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync Ecosystem-BT data' },
      { status: 500 }
    )
  }
}
