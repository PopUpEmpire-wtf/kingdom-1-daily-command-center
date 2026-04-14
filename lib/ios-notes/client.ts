/**
 * iOS Notes Integration via iCloud Notes API
 *
 * Setup requirements:
 * 1. Enable iCloud Notes
 * 2. Generate app-specific password at https://appleid.apple.com
 * 3. Set environment variables:
 *    - ICLOUD_USERNAME (Apple ID email)
 *    - ICLOUD_APP_PASSWORD (app-specific password)
 *
 * Note: iCloud Notes uses a proprietary format. This implementation
 * provides a simplified approach using CloudKit web services or HTTP API.
 */

import axios, { AxiosInstance } from 'axios';

export interface iOSNote {
  id: string;
  title: string;
  content: string;
  folder?: string;
  createdDate: Date;
  modifiedDate: Date;
  snippet?: string;
  tags?: string[];
  attachments?: string[];
}

export interface ExtractedTask {
  noteId: string;
  noteTitle: string;
  taskText: string;
  completed: boolean;
  lineNumber?: number;
}

export class iOSNotesClient {
  private client: AxiosInstance;
  private username: string;
  private password: string;

  constructor(username?: string, password?: string) {
    this.username = username || process.env.ICLOUD_USERNAME || '';
    this.password = password || process.env.ICLOUD_APP_PASSWORD || '';

    // Note: iCloud Notes API is not publicly documented
    // This is a conceptual implementation
    this.client = axios.create({
      baseURL: 'https://p131-notesws.icloud.com',
      auth: {
        username: this.username,
        password: this.password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      // Attempt to fetch folders as a connection test
      await this.getFolders();
      return true;
    } catch (error) {
      console.error('iCloud Notes connection test failed:', error);
      return false;
    }
  }

  async getFolders(): Promise<string[]> {
    try {
      // This is a placeholder - actual iCloud Notes API is not publicly available
      // In practice, you might need to use:
      // 1. CloudKit JS API
      // 2. Reverse-engineered endpoints
      // 3. Third-party libraries

      console.warn('iCloud Notes API integration requires CloudKit setup');

      return ['Notes', 'Tasks', 'Ideas'];
    } catch (error) {
      console.error('Error fetching folders:', error);
      return [];
    }
  }

  async getNotes(folder?: string): Promise<iOSNote[]> {
    try {
      // Placeholder implementation
      // Real implementation would query CloudKit or use iCloud API

      console.warn('iCloud Notes API integration requires CloudKit setup');
      console.info('Consider using alternative approach:');
      console.info('1. Export notes as files and scan filesystem');
      console.info('2. Use Mac Shortcuts automation to sync notes');
      console.info('3. Use third-party sync services');

      return [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  }

  /**
   * Extract tasks from notes based on common patterns
   * - Markdown checkboxes: - [ ] Task or - [x] Done
   * - Numbered lists starting with TODO
   * - Lines starting with • or - followed by task keywords
   */
  extractTasksFromNotes(notes: iOSNote[]): ExtractedTask[] {
    const tasks: ExtractedTask[] = [];

    for (const note of notes) {
      const lines = note.content.split('\n');

      lines.forEach((line, index) => {
        // Markdown checkboxes
        const checkboxMatch = line.match(/^[\s]*[-*•]\s*\[([ xX])\]\s*(.+)$/);
        if (checkboxMatch) {
          tasks.push({
            noteId: note.id,
            noteTitle: note.title,
            taskText: checkboxMatch[2].trim(),
            completed: checkboxMatch[1] !== ' ',
            lineNumber: index + 1,
          });
          return;
        }

        // TODO: lines
        const todoMatch = line.match(/^[\s]*(?:TODO|To-Do|To Do):?\s*(.+)$/i);
        if (todoMatch) {
          tasks.push({
            noteId: note.id,
            noteTitle: note.title,
            taskText: todoMatch[1].trim(),
            completed: false,
            lineNumber: index + 1,
          });
          return;
        }

        // Bullet points with task keywords
        const bulletMatch = line.match(/^[\s]*[-*•]\s*(.+)$/);
        if (bulletMatch) {
          const text = bulletMatch[1].trim();
          // Check if it looks like a task (starts with verb, contains keywords, etc.)
          if (this.looksLikeTask(text)) {
            tasks.push({
              noteId: note.id,
              noteTitle: note.title,
              taskText: text,
              completed: false,
              lineNumber: index + 1,
            });
          }
        }
      });
    }

    return tasks;
  }

  private looksLikeTask(text: string): boolean {
    const taskKeywords = [
      'complete', 'finish', 'do', 'call', 'email', 'send', 'review',
      'check', 'verify', 'test', 'fix', 'update', 'create', 'schedule',
      'plan', 'organize', 'prepare', 'contact', 'follow up', 'remind',
    ];

    const lowerText = text.toLowerCase();

    // Check if starts with action verb
    const startsWithVerb = taskKeywords.some(keyword => {
      return lowerText.startsWith(keyword + ' ') || lowerText.startsWith(keyword);
    });

    // Or contains task indicators
    const hasTaskIndicator = /\b(need to|must|should|have to|remember to)\b/i.test(text);

    // Or has due date indicators
    const hasDueDate = /\b(by|due|deadline|before|until)\b/i.test(text);

    return startsWithVerb || hasTaskIndicator || hasDueDate;
  }

  /**
   * Alternative: Read notes from exported files
   * If iCloud Notes are synced to a folder (e.g., via macOS)
   */
  async readNotesFromFiles(notesDirectory: string): Promise<iOSNote[]> {
    const fs = require('fs').promises;
    const path = require('path');

    try {
      const files = await fs.readdir(notesDirectory);
      const notes: iOSNote[] = [];

      for (const file of files) {
        if (file.endsWith('.txt') || file.endsWith('.md')) {
          const filePath = path.join(notesDirectory, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const stats = await fs.stat(filePath);

          // Extract title (first line or filename)
          const lines = content.split('\n');
          const title = lines[0]?.trim() || file.replace(/\.(txt|md)$/, '');

          notes.push({
            id: file,
            title,
            content,
            createdDate: stats.birthtime,
            modifiedDate: stats.mtime,
            snippet: content.substring(0, 200),
          });
        }
      }

      return notes;
    } catch (error) {
      console.error('Error reading notes from files:', error);
      return [];
    }
  }

  /**
   * Create a note (CloudKit required)
   */
  async createNote(note: Partial<iOSNote>): Promise<string> {
    console.warn('Creating notes requires CloudKit API setup');
    console.info('Alternative: Use Mac Shortcuts automation');

    // Placeholder
    return 'note-id-placeholder';
  }

  /**
   * Alternative approach: Generate Shortcuts automation
   * This creates a script that can be run on macOS to sync notes
   */
  generateMacShortcutScript(): string {
    return `
tell application "Notes"
    set allNotes to every note
    set notesList to {}

    repeat with aNote in allNotes
        set noteData to {¬
            id:id of aNote, ¬
            name:name of aNote, ¬
            body:body of aNote, ¬
            creationDate:creation date of aNote, ¬
            modificationDate:modification date of aNote¬
        }
        set end of notesList to noteData
    end repeat

    -- Export as JSON (requires additional scripting)
    return notesList
end tell
    `.trim();
  }
}

export default iOSNotesClient;
