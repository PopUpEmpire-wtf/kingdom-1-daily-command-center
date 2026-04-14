/**
 * iOS Reminders Integration via iCloud CalDAV
 *
 * Setup requirements:
 * 1. Enable iCloud Reminders
 * 2. Generate app-specific password at https://appleid.apple.com
 * 3. Set environment variables:
 *    - ICLOUD_USERNAME (Apple ID email)
 *    - ICLOUD_APP_PASSWORD (app-specific password)
 */

import axios, { AxiosInstance } from 'axios';

export interface iOSReminder {
  uid: string;
  title: string;
  notes?: string;
  dueDate?: Date;
  completed: boolean;
  completedDate?: Date;
  priority?: number; // 0=none, 1=high, 5=medium, 9=low
  list?: string;
  createdDate: Date;
  modifiedDate: Date;
  url?: string;
}

export class iOSRemindersClient {
  private client: AxiosInstance;
  private username: string;
  private password: string;
  private baseURL: string;

  constructor(username?: string, password?: string) {
    this.username = username || process.env.ICLOUD_USERNAME || '';
    this.password = password || process.env.ICLOUD_APP_PASSWORD || '';
    this.baseURL = `https://${this.username}@p${this.getServerNumber()}-caldav.icloud.com`;

    this.client = axios.create({
      baseURL: this.baseURL,
      auth: {
        username: this.username,
        password: this.password,
      },
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Depth': '1',
      },
    });
  }

  private getServerNumber(): string {
    // iCloud uses different server numbers based on account
    // This is a simplified version - may need adjustment
    return '131'; // Default server, adjust based on your account
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.request({
        method: 'PROPFIND',
        url: `/${this.getEncodedUsername()}/calendars/`,
        headers: {
          'Depth': '0',
        },
      });
      return response.status === 207;
    } catch (error) {
      console.error('iCloud connection test failed:', error);
      return false;
    }
  }

  private getEncodedUsername(): string {
    return encodeURIComponent(this.username);
  }

  async getReminders(): Promise<iOSReminder[]> {
    try {
      // First, discover reminder lists
      const lists = await this.discoverReminderLists();

      const allReminders: iOSReminder[] = [];

      for (const listUrl of lists) {
        const reminders = await this.getRemindersFromList(listUrl);
        allReminders.push(...reminders);
      }

      return allReminders;
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    }
  }

  private async discoverReminderLists(): Promise<string[]> {
    const propfindBody = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/">
  <d:prop>
    <d:resourcetype />
    <d:displayname />
    <cs:getctag />
  </d:prop>
</d:propfind>`;

    try {
      const response = await this.client.request({
        method: 'PROPFIND',
        url: `/${this.getEncodedUsername()}/calendars/`,
        data: propfindBody,
        headers: {
          'Depth': '1',
        },
      });

      // Parse XML response to extract reminder list URLs
      // This is simplified - you'd need an XML parser like 'fast-xml-parser'
      const urls: string[] = [];

      // For now, return default reminders URL
      urls.push(`/${this.getEncodedUsername()}/calendars/tasks/`);

      return urls;
    } catch (error) {
      console.error('Error discovering reminder lists:', error);
      return [];
    }
  }

  private async getRemindersFromList(listUrl: string): Promise<iOSReminder[]> {
    const reportBody = `<?xml version="1.0" encoding="UTF-8"?>
<c:calendar-query xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:d="DAV:">
  <d:prop>
    <d:getetag />
    <c:calendar-data />
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VTODO" />
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;

    try {
      const response = await this.client.request({
        method: 'REPORT',
        url: listUrl,
        data: reportBody,
        headers: {
          'Depth': '1',
        },
      });

      // Parse CalDAV response and extract VTODO items
      return this.parseCalDAVResponse(response.data);
    } catch (error) {
      console.error(`Error fetching reminders from ${listUrl}:`, error);
      return [];
    }
  }

  private parseCalDAVResponse(xmlData: string): iOSReminder[] {
    // This is a placeholder - you'd need a proper iCalendar parser
    // Consider using libraries like 'ical.js' or 'node-ical'

    const reminders: iOSReminder[] = [];

    // Simplified regex extraction (not production-ready)
    const vtodoRegex = /BEGIN:VTODO([\s\S]*?)END:VTODO/g;
    const matches = xmlData.matchAll(vtodoRegex);

    for (const match of matches) {
      const vtodo = match[1];

      const reminder: iOSReminder = {
        uid: this.extractField(vtodo, 'UID') || '',
        title: this.extractField(vtodo, 'SUMMARY') || 'Untitled',
        notes: this.extractField(vtodo, 'DESCRIPTION'),
        completed: vtodo.includes('STATUS:COMPLETED'),
        createdDate: this.parseDate(this.extractField(vtodo, 'CREATED')) || new Date(),
        modifiedDate: this.parseDate(this.extractField(vtodo, 'LAST-MODIFIED')) || new Date(),
        dueDate: this.parseDate(this.extractField(vtodo, 'DUE')),
        completedDate: this.parseDate(this.extractField(vtodo, 'COMPLETED')),
        priority: parseInt(this.extractField(vtodo, 'PRIORITY') || '0'),
        url: this.extractField(vtodo, 'URL'),
      };

      reminders.push(reminder);
    }

    return reminders;
  }

  private extractField(vtodo: string, field: string): string | undefined {
    const regex = new RegExp(`${field}:(.+)`, 'i');
    const match = vtodo.match(regex);
    return match ? match[1].trim() : undefined;
  }

  private parseDate(dateStr?: string): Date | undefined {
    if (!dateStr) return undefined;

    // iCalendar dates are in format: 20260413T120000Z
    const cleaned = dateStr.replace(/[^0-9TZ]/g, '');

    if (cleaned.length >= 8) {
      const year = parseInt(cleaned.substring(0, 4));
      const month = parseInt(cleaned.substring(4, 6)) - 1;
      const day = parseInt(cleaned.substring(6, 8));
      const hour = cleaned.length >= 13 ? parseInt(cleaned.substring(9, 11)) : 0;
      const minute = cleaned.length >= 13 ? parseInt(cleaned.substring(11, 13)) : 0;
      const second = cleaned.length >= 15 ? parseInt(cleaned.substring(13, 15)) : 0;

      return new Date(Date.UTC(year, month, day, hour, minute, second));
    }

    return undefined;
  }

  async createReminder(reminder: Partial<iOSReminder>): Promise<string> {
    const uid = reminder.uid || this.generateUID();
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const vtodo = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Kingdom-1 Command Center//EN
BEGIN:VTODO
UID:${uid}
DTSTAMP:${now}
SUMMARY:${reminder.title || 'Untitled'}
${reminder.notes ? `DESCRIPTION:${reminder.notes}` : ''}
${reminder.dueDate ? `DUE:${this.formatDate(reminder.dueDate)}` : ''}
${reminder.priority ? `PRIORITY:${reminder.priority}` : ''}
STATUS:${reminder.completed ? 'COMPLETED' : 'NEEDS-ACTION'}
${reminder.completedDate ? `COMPLETED:${this.formatDate(reminder.completedDate)}` : ''}
END:VTODO
END:VCALENDAR`;

    try {
      await this.client.put(
        `/${this.getEncodedUsername()}/calendars/tasks/${uid}.ics`,
        vtodo,
        {
          headers: {
            'Content-Type': 'text/calendar; charset=utf-8',
          },
        }
      );

      return uid;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  }

  private generateUID(): string {
    return `kingdom1-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  async updateReminder(uid: string, updates: Partial<iOSReminder>): Promise<void> {
    // Fetch existing reminder, modify it, and PUT back
    // Implementation similar to createReminder but with existing data
    throw new Error('Not implemented - requires fetching existing reminder first');
  }

  async deleteReminder(uid: string): Promise<void> {
    try {
      await this.client.delete(
        `/${this.getEncodedUsername()}/calendars/tasks/${uid}.ics`
      );
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }
}

export default iOSRemindersClient;
