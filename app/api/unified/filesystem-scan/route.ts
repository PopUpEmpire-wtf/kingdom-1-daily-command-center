import { NextRequest, NextResponse } from 'next/server';
import { FileSystemScanner } from '@/lib/filesystem/scanner';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 180; // 3 minutes for filesystem scan

const scanSchema = z.object({
  rootPaths: z.array(z.string()).optional(),
  excludePaths: z.array(z.string()).optional(),
  includeExtensions: z.array(z.string()).optional(),
  maxDepth: z.number().optional(),
  maxFileSize: z.number().optional(),
  saveToDb: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const params = scanSchema.parse(body);

    const scanner = new FileSystemScanner({
      rootPaths: params.rootPaths || [process.cwd()],
      excludePaths: params.excludePaths,
      includeExtensions: params.includeExtensions,
      maxDepth: params.maxDepth,
      maxFileSize: params.maxFileSize,
    });

    const tasks = await scanner.scan();

    let savedCount = 0;
    if (params.saveToDb) {
      savedCount = await scanner.saveToDatabase(tasks);
    }

    return NextResponse.json({
      success: true,
      data: {
        found: tasks.length,
        saved: savedCount,
        tasks: tasks.slice(0, 100), // Return first 100 for preview
        summary: {
          byType: tasks.reduce((acc, task) => {
            acc[task.taskType] = (acc[task.taskType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          byPriority: {
            high: tasks.filter(t => t.priority === 'HIGH').length,
            medium: tasks.filter(t => t.priority === 'MEDIUM').length,
            low: tasks.filter(t => t.priority === 'LOW').length,
            none: tasks.filter(t => !t.priority).length,
          },
        },
      },
    });
  } catch (error) {
    console.error('Filesystem scan error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST(new NextRequest('http://localhost/api/unified/filesystem-scan', {
    method: 'POST',
    body: JSON.stringify({}),
  }));
}
