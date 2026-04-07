export interface NotionDatabase {
  id: string
  title: string
  properties: Record<string, any>
}

export interface NotionPage {
  id: string
  properties: Record<string, any>
  created_time: string
  last_edited_time: string
}

export interface NotionSyncConfig {
  apiKey: string
  databaseIds: {
    projects?: string
    tasks?: string
    docs?: string
  }
}
