import { NextResponse } from 'next/server'
import { syncAllEcosystemBt } from '@/lib/ecosystem-bt/sync'

export async function POST() {
  try {
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
