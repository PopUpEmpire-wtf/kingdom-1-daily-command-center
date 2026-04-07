import { NextRequest, NextResponse } from 'next/server'
import { getAllProjects, getProjectsByStatus } from '@/lib/unified/aggregator'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const source = searchParams.get('source') as 'NOTION' | 'TASKADE' | null
    const status = searchParams.get('status')

    let projects

    if (status) {
      projects = await getProjectsByStatus(status)
    } else {
      projects = await getAllProjects(source || undefined)
    }

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching unified projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
