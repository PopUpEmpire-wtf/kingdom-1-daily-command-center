/**
 * Unified Task Merger
 *
 * Merges and deduplicates tasks from multiple sources:
 * - Notion
 * - Taskade
 * - File System (TODO comments, markdown tasks)
 * - iOS Reminders
 * - iOS Notes
 * - TaskFlow
 *
 * Uses fuzzy matching, date comparison, and content similarity
 * to identify duplicate tasks across sources.
 */

import { prisma } from '@/lib/prisma';
import { DataSource, TaskStatus } from '@prisma/client';

export interface UnifiedTask {
  canonicalId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: string;
  dueDate?: Date;
  tags?: string[];
  sources: TaskSource[];
  confidence: number; // 0-1, how confident we are about the merge
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskSource {
  source: DataSource;
  sourceId: string;
  sourcePath?: string;
  lastSynced: Date;
}

export interface SimilarityScore {
  titleSimilarity: number;
  dateSimilarity: number;
  contentSimilarity: number;
  overallScore: number;
}

export class TaskMerger {
  private similarityThreshold = 0.75; // 75% similarity to consider as duplicate

  /**
   * Merge tasks from all sources into unified view
   */
  async mergeAllTasks(): Promise<UnifiedTask[]> {
    // Fetch tasks from all sources
    const [
      notionTasks,
      taskadeTasks,
      filesystemTasks,
      // iOS and TaskFlow would be fetched similarly
    ] = await Promise.all([
      this.fetchNotionTasks(),
      this.fetchTaskadeTasks(),
      this.fetchFileSystemTasks(),
    ]);

    // Combine all tasks
    const allTasks = [
      ...notionTasks.map(t => this.normalizeTask(t, 'NOTION')),
      ...taskadeTasks.map(t => this.normalizeTask(t, 'TASKADE')),
      ...filesystemTasks.map(t => this.normalizeTask(t, 'FILESYSTEM')),
    ];

    // Group similar tasks
    const taskGroups = this.groupSimilarTasks(allTasks);

    // Create unified tasks from groups
    const unifiedTasks = await this.createUnifiedTasks(taskGroups);

    return unifiedTasks;
  }

  private async fetchNotionTasks() {
    return prisma.task.findMany({
      where: { source: 'NOTION' },
    });
  }

  private async fetchTaskadeTasks() {
    return prisma.task.findMany({
      where: { source: 'TASKADE' },
    });
  }

  private async fetchFileSystemTasks() {
    return prisma.fileSystemTask.findMany();
  }

  /**
   * Normalize task format across sources
   */
  private normalizeTask(task: any, source: DataSource): NormalizedTask {
    return {
      id: task.id,
      externalId: task.externalId || task.id,
      source,
      title: this.normalizeTitle(task.title || task.content),
      description: task.description || task.context,
      status: this.normalizeStatus(task.status),
      priority: task.priority,
      dueDate: task.dueDate,
      tags: this.normalizeTags(task.tags),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      metadata: {
        filePath: task.filePath,
        lineNumber: task.lineNumber,
        taskType: task.taskType,
      },
    };
  }

  private normalizeTitle(title: string): string {
    return title
      .trim()
      .replace(/^(TODO|FIXME|HACK|NOTE|BUG|XXX):?\s*/i, '')
      .replace(/\s+/g, ' ');
  }

  private normalizeStatus(status: any): TaskStatus {
    if (typeof status === 'string') {
      const upper = status.toUpperCase();
      if (upper.includes('DONE') || upper.includes('COMPLETED')) return 'DONE';
      if (upper.includes('PROGRESS') || upper.includes('DOING')) return 'IN_PROGRESS';
      return 'TODO';
    }
    return status || 'TODO';
  }

  private normalizeTags(tags: any): string[] {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      try {
        return JSON.parse(tags);
      } catch {
        return tags.split(',').map(t => t.trim());
      }
    }
    return [];
  }

  /**
   * Group similar tasks together using fuzzy matching
   */
  private groupSimilarTasks(tasks: NormalizedTask[]): NormalizedTask[][] {
    const groups: NormalizedTask[][] = [];
    const processed = new Set<string>();

    for (const task of tasks) {
      if (processed.has(task.id)) continue;

      const similarTasks = [task];
      processed.add(task.id);

      // Find all similar tasks
      for (const otherTask of tasks) {
        if (processed.has(otherTask.id)) continue;
        if (task.source === otherTask.source) continue; // Don't merge within same source

        const similarity = this.calculateSimilarity(task, otherTask);

        if (similarity.overallScore >= this.similarityThreshold) {
          similarTasks.push(otherTask);
          processed.add(otherTask.id);
        }
      }

      groups.push(similarTasks);
    }

    return groups;
  }

  /**
   * Calculate similarity score between two tasks
   */
  calculateSimilarity(task1: NormalizedTask, task2: NormalizedTask): SimilarityScore {
    const titleSim = this.stringSimilarity(task1.title, task2.title);
    const dateSim = this.dateSimilarity(task1.dueDate, task2.dueDate);
    const contentSim = this.stringSimilarity(
      task1.description || '',
      task2.description || ''
    );

    // Weighted average
    const overallScore =
      titleSim * 0.5 +       // Title is most important
      dateSim * 0.3 +        // Due date is significant
      contentSim * 0.2;      // Description helps but is optional

    return {
      titleSimilarity: titleSim,
      dateSimilarity: dateSim,
      contentSimilarity: contentSim,
      overallScore,
    };
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private stringSimilarity(str1: string, str2: string): number {
    if (!str1 && !str2) return 1;
    if (!str1 || !str2) return 0;

    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;

    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate date similarity (1 if same/close, 0 if far apart or missing)
   */
  private dateSimilarity(date1?: Date, date2?: Date): number {
    if (!date1 && !date2) return 1; // Both null is a match
    if (!date1 || !date2) return 0.5; // One null is neutral

    const diff = Math.abs(date1.getTime() - date2.getTime());
    const daysDiff = diff / (1000 * 60 * 60 * 24);

    // Same day = 1.0, 1 day apart = 0.8, 7 days = 0.2, 30+ days = 0
    if (daysDiff === 0) return 1.0;
    if (daysDiff <= 1) return 0.8;
    if (daysDiff <= 7) return 0.5;
    if (daysDiff <= 30) return 0.2;
    return 0;
  }

  /**
   * Create unified tasks from groups and store mappings
   */
  private async createUnifiedTasks(groups: NormalizedTask[][]): Promise<UnifiedTask[]> {
    const unifiedTasks: UnifiedTask[] = [];

    for (const group of groups) {
      if (group.length === 0) continue;

      // Choose the "primary" task (most recently updated, or from preferred source)
      const primary = this.choosePrimaryTask(group);

      // Create canonical ID
      const canonicalId = `unified-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      // Merge data from all sources
      const unified: UnifiedTask = {
        canonicalId,
        title: primary.title,
        description: this.mergeDescriptions(group),
        status: this.mergeStatus(group),
        priority: this.mergePriority(group),
        dueDate: this.mergeDueDate(group),
        tags: this.mergeTags(group),
        sources: group.map(t => ({
          source: t.source,
          sourceId: t.externalId,
          sourcePath: t.metadata?.filePath,
          lastSynced: t.updatedAt,
        })),
        confidence: group.length > 1 ? this.calculateGroupConfidence(group) : 1.0,
        createdAt: this.getEarliestDate(group),
        updatedAt: this.getLatestDate(group),
      };

      // Store mappings in database
      for (const task of group) {
        await prisma.taskMapping.upsert({
          where: {
            source_sourceId: {
              source: task.source,
              sourceId: task.externalId,
            },
          },
          create: {
            canonicalId,
            source: task.source,
            sourceId: task.externalId,
            sourcePath: task.metadata?.filePath,
            confidence: unified.confidence,
            lastVerified: new Date(),
          },
          update: {
            canonicalId,
            confidence: unified.confidence,
            lastVerified: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      unifiedTasks.push(unified);
    }

    return unifiedTasks;
  }

  private choosePrimaryTask(tasks: NormalizedTask[]): NormalizedTask {
    // Prefer order: Notion > Taskade > TaskFlow > iOS Reminders > iOS Notes > FileSystem
    const sourceOrder: DataSource[] = [
      'NOTION',
      'TASKADE',
      'TASKFLOW',
      'IOS_REMINDERS',
      'IOS_NOTES',
      'FILESYSTEM',
    ];

    for (const preferredSource of sourceOrder) {
      const found = tasks.find(t => t.source === preferredSource);
      if (found) return found;
    }

    // Fallback: most recently updated
    return tasks.reduce((latest, current) =>
      current.updatedAt > latest.updatedAt ? current : latest
    );
  }

  private mergeDescriptions(tasks: NormalizedTask[]): string | undefined {
    const descriptions = tasks
      .map(t => t.description)
      .filter((d): d is string => !!d && d.length > 0);

    if (descriptions.length === 0) return undefined;

    // Return the longest/most detailed description
    return descriptions.reduce((longest, current) =>
      current.length > longest.length ? current : longest
    );
  }

  private mergeStatus(tasks: NormalizedTask[]): TaskStatus {
    // If any task is done, mark as done
    if (tasks.some(t => t.status === 'DONE')) return 'DONE';
    // If any task is in progress, mark as in progress
    if (tasks.some(t => t.status === 'IN_PROGRESS')) return 'IN_PROGRESS';
    return 'TODO';
  }

  private mergePriority(tasks: NormalizedTask[]): string | undefined {
    const priorities = tasks.map(t => t.priority).filter((p): p is string => !!p);

    if (priorities.length === 0) return undefined;

    // Return highest priority
    if (priorities.includes('HIGH')) return 'HIGH';
    if (priorities.includes('MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }

  private mergeDueDate(tasks: NormalizedTask[]): Date | undefined {
    const dates = tasks.map(t => t.dueDate).filter((d): d is Date => !!d);

    if (dates.length === 0) return undefined;

    // Return earliest due date
    return dates.reduce((earliest, current) =>
      current < earliest ? current : earliest
    );
  }

  private mergeTags(tasks: NormalizedTask[]): string[] {
    const allTags = new Set<string>();

    for (const task of tasks) {
      task.tags.forEach(tag => allTags.add(tag));
    }

    return Array.from(allTags);
  }

  private calculateGroupConfidence(tasks: NormalizedTask[]): number {
    if (tasks.length < 2) return 1.0;

    // Calculate average similarity between all pairs
    let totalSimilarity = 0;
    let pairCount = 0;

    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const similarity = this.calculateSimilarity(tasks[i], tasks[j]);
        totalSimilarity += similarity.overallScore;
        pairCount++;
      }
    }

    return pairCount > 0 ? totalSimilarity / pairCount : 1.0;
  }

  private getEarliestDate(tasks: NormalizedTask[]): Date {
    return tasks.reduce((earliest, current) =>
      current.createdAt < earliest.createdAt ? current : earliest
    ).createdAt;
  }

  private getLatestDate(tasks: NormalizedTask[]): Date {
    return tasks.reduce((latest, current) =>
      current.updatedAt > latest.updatedAt ? current : latest
    ).updatedAt;
  }

  /**
   * Find canonical task ID for a specific source task
   */
  async findCanonicalId(source: DataSource, sourceId: string): Promise<string | null> {
    const mapping = await prisma.taskMapping.findUnique({
      where: {
        source_sourceId: {
          source,
          sourceId,
        },
      },
    });

    return mapping?.canonicalId || null;
  }

  /**
   * Get all sources for a canonical task
   */
  async getTaskSources(canonicalId: string): Promise<TaskSource[]> {
    const mappings = await prisma.taskMapping.findMany({
      where: { canonicalId },
    });

    return mappings.map(m => ({
      source: m.source,
      sourceId: m.sourceId,
      sourcePath: m.sourcePath || undefined,
      lastSynced: m.lastVerified,
    }));
  }
}

interface NormalizedTask {
  id: string;
  externalId: string;
  source: DataSource;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: string;
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    filePath?: string;
    lineNumber?: number;
    taskType?: string;
  };
}

export default TaskMerger;
