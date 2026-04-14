import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export interface ScanOptions {
  rootPaths: string[];
  excludePaths?: string[];
  includeExtensions?: string[];
  maxDepth?: number;
  maxFileSize?: number; // in bytes
}

export interface FoundTask {
  filePath: string;
  lineNumber?: number;
  taskType: string;
  content: string;
  context?: string;
  priority?: string;
  tags?: string[];
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

const DEFAULT_EXCLUDE = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  '.cache',
  'vendor',
  'tmp',
  'temp',
];

const CODE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.rb', '.go', '.rs',
  '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.swift',
  '.kt', '.scala', '.sh', '.bash', '.zsh', '.sql',
];

const DOC_EXTENSIONS = [
  '.md', '.txt', '.org', '.rst',
];

const TASK_PATTERNS = {
  // Code comments
  TODO: /(?:\/\/|#|<!--|\/\*)\s*TODO:?\s*(.+?)(?:\*\/|-->|$)/gi,
  FIXME: /(?:\/\/|#|<!--|\/\*)\s*FIXME:?\s*(.+?)(?:\*\/|-->|$)/gi,
  HACK: /(?:\/\/|#|<!--|\/\*)\s*HACK:?\s*(.+?)(?:\*\/|-->|$)/gi,
  NOTE: /(?:\/\/|#|<!--|\/\*)\s*NOTE:?\s*(.+?)(?:\*\/|-->|$)/gi,
  BUG: /(?:\/\/|#|<!--|\/\*)\s*BUG:?\s*(.+?)(?:\*\/|-->|$)/gi,
  XXX: /(?:\/\/|#|<!--|\/\*)\s*XXX:?\s*(.+?)(?:\*\/|-->|$)/gi,

  // Markdown tasks
  MARKDOWN: /^[\s]*[-*]\s*\[([ xX])\]\s*(.+)$/gm,

  // Priority markers
  PRIORITY_HIGH: /\[!+\]|\(HIGH\)|P0|P1/i,
  PRIORITY_MEDIUM: /\[!\]|\(MEDIUM\)|P2|P3/i,
  PRIORITY_LOW: /\(LOW\)|P4|P5/i,

  // Tags
  TAGS: /#(\w+)/g,
};

export class FileSystemScanner {
  private options: Required<ScanOptions>;

  constructor(options: ScanOptions) {
    this.options = {
      rootPaths: options.rootPaths,
      excludePaths: options.excludePaths || DEFAULT_EXCLUDE,
      includeExtensions: options.includeExtensions || [...CODE_EXTENSIONS, ...DOC_EXTENSIONS],
      maxDepth: options.maxDepth || 10,
      maxFileSize: options.maxFileSize || 1024 * 1024, // 1MB default
    };
  }

  async scan(): Promise<FoundTask[]> {
    const allTasks: FoundTask[] = [];

    for (const rootPath of this.options.rootPaths) {
      try {
        const tasks = await this.scanDirectory(rootPath, 0);
        allTasks.push(...tasks);
      } catch (error) {
        console.error(`Error scanning ${rootPath}:`, error);
      }
    }

    return allTasks;
  }

  private async scanDirectory(dirPath: string, depth: number): Promise<FoundTask[]> {
    if (depth > this.options.maxDepth) return [];

    const tasks: FoundTask[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip excluded paths
        if (this.shouldExclude(entry.name)) continue;

        if (entry.isDirectory()) {
          const subTasks = await this.scanDirectory(fullPath, depth + 1);
          tasks.push(...subTasks);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (this.options.includeExtensions.includes(ext)) {
            const fileTasks = await this.scanFile(fullPath);
            tasks.push(...fileTasks);
          }
        }
      }
    } catch (error) {
      // Permission denied or other errors - skip
      console.debug(`Skipping ${dirPath}:`, error);
    }

    return tasks;
  }

  private shouldExclude(name: string): boolean {
    return this.options.excludePaths.some(excluded => {
      if (excluded.includes('*')) {
        const regex = new RegExp(excluded.replace(/\*/g, '.*'));
        return regex.test(name);
      }
      return name === excluded || name.startsWith(excluded);
    });
  }

  private async scanFile(filePath: string): Promise<FoundTask[]> {
    try {
      const stats = await fs.stat(filePath);

      // Skip large files
      if (stats.size > this.options.maxFileSize) {
        return [];
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const ext = path.extname(filePath).toLowerCase();

      if (ext === '.md') {
        return this.extractMarkdownTasks(filePath, content);
      } else {
        return this.extractCodeTasks(filePath, content);
      }
    } catch (error) {
      // Can't read file (binary, permissions, etc.)
      return [];
    }
  }

  private extractMarkdownTasks(filePath: string, content: string): FoundTask[] {
    const tasks: FoundTask[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const match = /^[\s]*[-*]\s*\[([ xX])\]\s*(.+)$/.exec(line);
      if (match) {
        const [, checkbox, taskContent] = match;
        const status = checkbox === ' ' ? 'TODO' : 'DONE';

        const task: FoundTask = {
          filePath,
          lineNumber: index + 1,
          taskType: 'MARKDOWN',
          content: taskContent.trim(),
          status,
          priority: this.extractPriority(taskContent),
          tags: this.extractTags(taskContent),
          context: this.getContext(lines, index),
        };

        tasks.push(task);
      }
    });

    return tasks;
  }

  private extractCodeTasks(filePath: string, content: string): FoundTask[] {
    const tasks: FoundTask[] = [];
    const lines = content.split('\n');

    // Check each task pattern
    for (const [type, pattern] of Object.entries(TASK_PATTERNS)) {
      if (['PRIORITY_HIGH', 'PRIORITY_MEDIUM', 'PRIORITY_LOW', 'TAGS'].includes(type)) {
        continue;
      }

      if (type === 'MARKDOWN') continue; // Already handled

      const matches = content.matchAll(pattern);

      for (const match of matches) {
        const taskContent = match[1]?.trim();
        if (!taskContent) continue;

        // Find line number
        const lineNumber = this.findLineNumber(content, match.index || 0);

        const task: FoundTask = {
          filePath,
          lineNumber,
          taskType: type,
          content: taskContent,
          priority: this.extractPriority(taskContent),
          tags: this.extractTags(taskContent),
          context: this.getContext(lines, lineNumber - 1),
        };

        tasks.push(task);
      }
    }

    return tasks;
  }

  private findLineNumber(content: string, charIndex: number): number {
    const beforeMatch = content.substring(0, charIndex);
    return beforeMatch.split('\n').length;
  }

  private extractPriority(content: string): string | undefined {
    if (TASK_PATTERNS.PRIORITY_HIGH.test(content)) return 'HIGH';
    if (TASK_PATTERNS.PRIORITY_MEDIUM.test(content)) return 'MEDIUM';
    if (TASK_PATTERNS.PRIORITY_LOW.test(content)) return 'LOW';
    return undefined;
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const matches = content.matchAll(TASK_PATTERNS.TAGS);
    for (const match of matches) {
      if (match[1]) tags.push(match[1]);
    }
    return tags;
  }

  private getContext(lines: string[], lineIndex: number, contextLines: number = 2): string {
    const start = Math.max(0, lineIndex - contextLines);
    const end = Math.min(lines.length, lineIndex + contextLines + 1);
    return lines.slice(start, end).join('\n');
  }

  async saveToDatabase(tasks: FoundTask[]): Promise<number> {
    let savedCount = 0;

    for (const task of tasks) {
      try {
        await prisma.fileSystemTask.upsert({
          where: {
            filePath_lineNumber_content: {
              filePath: task.filePath,
              lineNumber: task.lineNumber || 0,
              content: task.content,
            },
          },
          create: {
            filePath: task.filePath,
            lineNumber: task.lineNumber,
            taskType: task.taskType,
            content: task.content,
            context: task.context,
            status: task.status || 'TODO',
            priority: task.priority,
            tags: task.tags ? JSON.stringify(task.tags) : null,
            lastScanAt: new Date(),
          },
          update: {
            taskType: task.taskType,
            context: task.context,
            status: task.status || 'TODO',
            priority: task.priority,
            tags: task.tags ? JSON.stringify(task.tags) : null,
            lastScanAt: new Date(),
            updatedAt: new Date(),
          },
        });

        savedCount++;
      } catch (error) {
        console.error(`Error saving task from ${task.filePath}:${task.lineNumber}:`, error);
      }
    }

    // Log sync
    await prisma.syncLog.create({
      data: {
        source: 'FILESYSTEM',
        status: 'SUCCESS',
        message: `Scanned and saved ${savedCount} tasks`,
        itemsSynced: savedCount,
        timestamp: new Date(),
      },
    });

    return savedCount;
  }

  async cleanupStale(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoffDate = new Date(Date.now() - maxAge);

    const result = await prisma.fileSystemTask.deleteMany({
      where: {
        lastScanAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}
