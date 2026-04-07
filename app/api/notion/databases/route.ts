import { NextResponse } from 'next/server'
import { listDatabases } from '@/lib/notion/client'

export async function GET() {
  try {
    const databases = await listDatabases()

    return NextResponse.json({ databases })
  } catch (error) {
    console.error('Error listing Notion databases:', error)
    return NextResponse.json(
      { error: 'Failed to list Notion databases' },
      { status: 500 }
    )
  }
}
