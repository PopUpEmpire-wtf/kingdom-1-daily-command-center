import { Client } from '@notionhq/client'

let notionClient: Client | null = null

export function getNotionClient(): Client {
  if (!notionClient) {
    const apiKey = process.env.NOTION_API_KEY

    if (!apiKey) {
      throw new Error('NOTION_API_KEY is not configured')
    }

    notionClient = new Client({ auth: apiKey })
  }

  return notionClient
}

export async function listDatabases() {
  const client = getNotionClient()

  try {
    const response = await client.search({
      filter: {
        property: 'object',
        value: 'database',
      },
    })

    return response.results
  } catch (error) {
    console.error('Error listing Notion databases:', error)
    throw error
  }
}

export async function queryDatabase(databaseId: string, filter?: any) {
  const client = getNotionClient()

  try {
    const response = await client.databases.query({
      database_id: databaseId,
      filter,
    })

    return response.results
  } catch (error) {
    console.error('Error querying Notion database:', error)
    throw error
  }
}

export async function getPage(pageId: string) {
  const client = getNotionClient()

  try {
    const response = await client.pages.retrieve({ page_id: pageId })
    return response
  } catch (error) {
    console.error('Error getting Notion page:', error)
    throw error
  }
}

export async function updatePage(pageId: string, properties: any) {
  const client = getNotionClient()

  try {
    const response = await client.pages.update({
      page_id: pageId,
      properties,
    })
    return response
  } catch (error) {
    console.error('Error updating Notion page:', error)
    throw error
  }
}

export async function createPage(databaseId: string, properties: any) {
  const client = getNotionClient()

  try {
    const response = await client.pages.create({
      parent: { database_id: databaseId },
      properties,
    })
    return response
  } catch (error) {
    console.error('Error creating Notion page:', error)
    throw error
  }
}
