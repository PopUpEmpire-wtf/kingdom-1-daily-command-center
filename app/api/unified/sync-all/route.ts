import { NextRequest, NextResponse } from 'next/server';
import { SyncOrchestrator } from '@/lib/unified/orchestrator';
import { DataSource } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for full sync

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const orchestrator = new SyncOrchestrator({
      sources: body.sources,
      scanPaths: body.scanPaths,
      enableAutoMerge: body.enableAutoMerge ?? true,
      conflictStrategy: body.conflictStrategy || 'latest',
    });

    const result = await orchestrator.syncAll();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Sync all error:', error);
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
  const searchParams = request.nextUrl.searchParams;
  const sources = searchParams.get('sources')?.split(',') as DataSource[] | undefined;

  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ sources }),
  }));
}
