import { NextRequest, NextResponse } from 'next/server';
import { TaskMerger } from '@/lib/unified/merger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const merger = new TaskMerger();
    const unifiedTasks = await merger.mergeAllTasks();

    // Apply filters from query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0');

    let filtered = unifiedTasks;

    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }

    if (priority) {
      filtered = filtered.filter(t => t.priority === priority);
    }

    if (minConfidence > 0) {
      filtered = filtered.filter(t => t.confidence >= minConfidence);
    }

    return NextResponse.json({
      success: true,
      data: {
        total: filtered.length,
        tasks: filtered,
        stats: {
          totalTasks: unifiedTasks.length,
          withMultipleSources: unifiedTasks.filter(t => t.sources.length > 1).length,
          averageConfidence:
            unifiedTasks.reduce((sum, t) => sum + t.confidence, 0) / unifiedTasks.length,
        },
      },
    });
  } catch (error) {
    console.error('Merged tasks error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
