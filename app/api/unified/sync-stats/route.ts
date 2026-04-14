import { NextRequest, NextResponse } from 'next/server';
import { SyncOrchestrator } from '@/lib/unified/orchestrator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const orchestrator = new SyncOrchestrator();
    const stats = await orchestrator.getSyncStats();
    const history = await orchestrator.getSyncHistory(20);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentSyncs: history,
      },
    });
  } catch (error) {
    console.error('Sync stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
