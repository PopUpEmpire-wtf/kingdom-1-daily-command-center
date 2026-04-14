/**
 * Sync Orchestrator
 *
 * Coordinates synchronization across all task sources:
 * - Notion
 * - Taskade
 * - File System
 * - iOS Reminders
 * - iOS Notes
 * - TaskFlow
 *
 * Handles conflict resolution, merge strategies, and keeps all sources in sync.
 */

import { prisma } from '@/lib/prisma';
import { DataSource } from '@prisma/client';
import { FileSystemScanner } from '@/lib/filesystem/scanner';
import { TaskMerger, UnifiedTask } from '@/lib/unified/merger';
import { iOSRemindersClient } from '@/lib/ios-reminders/client';
import { iOSNotesClient } from '@/lib/ios-notes/client';
import { TaskFlowClient } from '@/lib/taskflow/client';

export interface SyncConfig {
  sources?: DataSource[];
  scanPaths?: string[];
  enableAutoMerge?: boolean;
  conflictStrategy?: 'latest' | 'manual' | 'source-priority';
  sourcePriority?: DataSource[];
}

export interface SyncResult {
  source: DataSource;
  success: boolean;
  itemsFetched: number;
  itemsSynced: number;
  errors: string[];
  duration: number;
}

export interface OrchestratorResult {
  totalSynced: number;
  results: SyncResult[];
  mergeResults?: {
    totalGroups: number;
    totalUnified: number;
    duplicatesFound: number;
  };
  timestamp: Date;
}

export class SyncOrchestrator {
  private config: Required<SyncConfig>;
  private merger: TaskMerger;

  constructor(config: SyncConfig = {}) {
    this.config = {
      sources: config.sources || [
        'NOTION',
        'TASKADE',
        'FILESYSTEM',
        'IOS_REMINDERS',
        'IOS_NOTES',
        'TASKFLOW',
      ],
      scanPaths: config.scanPaths || [process.cwd()],
      enableAutoMerge: config.enableAutoMerge ?? true,
      conflictStrategy: config.conflictStrategy || 'latest',
      sourcePriority: config.sourcePriority || [
        'NOTION',
        'TASKADE',
        'TASKFLOW',
        'IOS_REMINDERS',
        'IOS_NOTES',
        'FILESYSTEM',
      ],
    };

    this.merger = new TaskMerger();
  }

  /**
   * Run full sync across all enabled sources
   */
  async syncAll(): Promise<OrchestratorResult> {
    console.log('🚀 Starting full sync across all sources...');

    const results: SyncResult[] = [];
    const startTime = Date.now();

    // Sync each source in parallel
    const syncPromises = this.config.sources.map(source =>
      this.syncSource(source).catch(error => ({
        source,
        success: false,
        itemsFetched: 0,
        itemsSynced: 0,
        errors: [error.message],
        duration: 0,
      }))
    );

    const syncResults = await Promise.all(syncPromises);
    results.push(...syncResults);

    // Merge tasks if enabled
    let mergeResults;
    if (this.config.enableAutoMerge) {
      console.log('🔄 Merging tasks from all sources...');
      mergeResults = await this.mergeAllTasks();
    }

    const totalSynced = results.reduce((sum, r) => sum + r.itemsSynced, 0);

    console.log(`✅ Sync complete! ${totalSynced} items synced in ${Date.now() - startTime}ms`);

    return {
      totalSynced,
      results,
      mergeResults,
      timestamp: new Date(),
    };
  }

  /**
   * Sync individual source
   */
  private async syncSource(source: DataSource): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      source,
      success: false,
      itemsFetched: 0,
      itemsSynced: 0,
      errors: [],
      duration: 0,
    };

    try {
      console.log(`📥 Syncing ${source}...`);

      switch (source) {
        case 'NOTION':
          await this.syncNotion(result);
          break;
        case 'TASKADE':
          await this.syncTaskade(result);
          break;
        case 'FILESYSTEM':
          await this.syncFileSystem(result);
          break;
        case 'IOS_REMINDERS':
          await this.syncIOSReminders(result);
          break;
        case 'IOS_NOTES':
          await this.syncIOSNotes(result);
          break;
        case 'TASKFLOW':
          await this.syncTaskFlow(result);
          break;
        default:
          result.errors.push(`Unknown source: ${source}`);
      }

      result.success = result.errors.length === 0;
    } catch (error: any) {
      result.errors.push(error.message);
      console.error(`❌ Error syncing ${source}:`, error);
    } finally {
      result.duration = Date.now() - startTime;

      // Log sync result
      await prisma.syncLog.create({
        data: {
          source,
          status: result.success ? 'SUCCESS' : 'ERROR',
          message: result.errors.join('; ') || `Synced ${result.itemsSynced} items`,
          itemsSynced: result.itemsSynced,
          timestamp: new Date(),
        },
      });
    }

    return result;
  }

  private async syncNotion(result: SyncResult): Promise<void> {
    // Import and use existing Notion sync
    const { syncNotionData } = await import('@/lib/notion/sync');
    await syncNotionData();
    result.itemsFetched = await prisma.task.count({ where: { source: 'NOTION' } });
    result.itemsSynced = result.itemsFetched;
  }

  private async syncTaskade(result: SyncResult): Promise<void> {
    // Import and use existing Taskade sync
    const { syncTaskadeData } = await import('@/lib/taskade/sync');
    await syncTaskadeData();
    result.itemsFetched = await prisma.task.count({ where: { source: 'TASKADE' } });
    result.itemsSynced = result.itemsFetched;
  }

  private async syncFileSystem(result: SyncResult): Promise<void> {
    const scanner = new FileSystemScanner({
      rootPaths: this.config.scanPaths,
    });

    const tasks = await scanner.scan();
    result.itemsFetched = tasks.length;

    const saved = await scanner.saveToDatabase(tasks);
    result.itemsSynced = saved;

    // Cleanup stale tasks (not seen in 7 days)
    await scanner.cleanupStale();
  }

  private async syncIOSReminders(result: SyncResult): Promise<void> {
    const client = new iOSRemindersClient();

    const connected = await client.testConnection();
    if (!connected) {
      result.errors.push('Failed to connect to iCloud Reminders');
      return;
    }

    const reminders = await client.getReminders();
    result.itemsFetched = reminders.length;

    // Store reminders as tasks
    for (const reminder of reminders) {
      await prisma.task.upsert({
        where: {
          source_externalId: {
            source: 'IOS_REMINDERS',
            externalId: reminder.uid,
          },
        },
        create: {
          source: 'IOS_REMINDERS',
          externalId: reminder.uid,
          title: reminder.title,
          description: reminder.notes,
          status: reminder.completed ? 'DONE' : 'TODO',
          dueDate: reminder.dueDate,
          priority: this.mapReminderPriority(reminder.priority),
          tags: reminder.list ? JSON.stringify([reminder.list]) : null,
          lastSyncAt: new Date(),
        },
        update: {
          title: reminder.title,
          description: reminder.notes,
          status: reminder.completed ? 'DONE' : 'TODO',
          dueDate: reminder.dueDate,
          priority: this.mapReminderPriority(reminder.priority),
          tags: reminder.list ? JSON.stringify([reminder.list]) : null,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        },
      });

      result.itemsSynced++;
    }
  }

  private mapReminderPriority(priority?: number): string | null {
    if (!priority || priority === 0) return null;
    if (priority <= 1) return 'HIGH';
    if (priority <= 5) return 'MEDIUM';
    return 'LOW';
  }

  private async syncIOSNotes(result: SyncResult): Promise<void> {
    const client = new iOSNotesClient();

    // Try file-based approach first
    const notesPath = process.env.IOS_NOTES_PATH;
    if (!notesPath) {
      result.errors.push('IOS_NOTES_PATH not configured. Set to iCloud Notes folder path.');
      return;
    }

    const notes = await client.readNotesFromFiles(notesPath);
    const extractedTasks = client.extractTasksFromNotes(notes);

    result.itemsFetched = extractedTasks.length;

    // Store extracted tasks
    for (const task of extractedTasks) {
      await prisma.task.upsert({
        where: {
          source_externalId: {
            source: 'IOS_NOTES',
            externalId: `${task.noteId}-${task.lineNumber}`,
          },
        },
        create: {
          source: 'IOS_NOTES',
          externalId: `${task.noteId}-${task.lineNumber}`,
          title: task.taskText,
          description: `From note: ${task.noteTitle}`,
          status: task.completed ? 'DONE' : 'TODO',
          lastSyncAt: new Date(),
        },
        update: {
          title: task.taskText,
          description: `From note: ${task.noteTitle}`,
          status: task.completed ? 'DONE' : 'TODO',
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        },
      });

      result.itemsSynced++;
    }
  }

  private async syncTaskFlow(result: SyncResult): Promise<void> {
    const client = new TaskFlowClient();

    const connected = await client.testConnection();
    if (!connected) {
      result.errors.push('Failed to connect to TaskFlow API');
      return;
    }

    const tasks = await client.getTasks();
    result.itemsFetched = tasks.length;

    for (const task of tasks) {
      await prisma.task.upsert({
        where: {
          source_externalId: {
            source: 'TASKFLOW',
            externalId: task.id,
          },
        },
        create: {
          source: 'TASKFLOW',
          externalId: task.id,
          title: task.title,
          description: task.description,
          status: this.mapTaskFlowStatus(task.status),
          dueDate: task.dueDate,
          priority: task.priority?.toUpperCase(),
          tags: task.tags ? JSON.stringify(task.tags) : null,
          lastSyncAt: new Date(),
        },
        update: {
          title: task.title,
          description: task.description,
          status: this.mapTaskFlowStatus(task.status),
          dueDate: task.dueDate,
          priority: task.priority?.toUpperCase(),
          tags: task.tags ? JSON.stringify(task.tags) : null,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        },
      });

      result.itemsSynced++;
    }
  }

  private mapTaskFlowStatus(status: string): 'TODO' | 'IN_PROGRESS' | 'DONE' {
    const lower = status.toLowerCase();
    if (lower === 'done' || lower === 'completed') return 'DONE';
    if (lower === 'in_progress' || lower === 'doing' || lower === 'active') return 'IN_PROGRESS';
    return 'TODO';
  }

  /**
   * Merge all tasks and return statistics
   */
  private async mergeAllTasks() {
    const unifiedTasks = await this.merger.mergeAllTasks();

    const totalGroups = unifiedTasks.length;
    const duplicatesFound = unifiedTasks.filter(t => t.sources.length > 1).length;

    return {
      totalGroups,
      totalUnified: unifiedTasks.length,
      duplicatesFound,
    };
  }

  /**
   * Get sync history for all sources
   */
  async getSyncHistory(limit: number = 50) {
    return prisma.syncLog.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get sync stats
   */
  async getSyncStats() {
    const [notionCount, taskadeCount, filesystemCount] = await Promise.all([
      prisma.task.count({ where: { source: 'NOTION' } }),
      prisma.task.count({ where: { source: 'TASKADE' } }),
      prisma.fileSystemTask.count(),
    ]);

    const lastSyncs = await Promise.all(
      ['NOTION', 'TASKADE', 'FILESYSTEM', 'IOS_REMINDERS', 'IOS_NOTES', 'TASKFLOW'].map(
        async source =>
          prisma.syncLog.findFirst({
            where: { source: source as DataSource },
            orderBy: { timestamp: 'desc' },
          })
      )
    );

    return {
      counts: {
        notion: notionCount,
        taskade: taskadeCount,
        filesystem: filesystemCount,
      },
      lastSyncs: lastSyncs.reduce((acc, log, idx) => {
        const sources = ['NOTION', 'TASKADE', 'FILESYSTEM', 'IOS_REMINDERS', 'IOS_NOTES', 'TASKFLOW'];
        acc[sources[idx]] = log;
        return acc;
      }, {} as any),
    };
  }
}

export default SyncOrchestrator;
