import { NextRequest, NextResponse } from 'next/server'

import { createProject, getAllProjects } from '@/lib/db/projects'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = parseInt(searchParams.get('limit') || '0', 10)

    const projects = await getAllProjects()

    // Apply limit if specified
    const limitedProjects = limitParam > 0 ? projects.slice(0, limitParam) : projects

    return NextResponse.json({ success: true, data: limitedProjects, projects: limitedProjects })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, orderId, status } = body

    if (!name) {
      return NextResponse.json({ success: false, error: 'Project name is required' }, { status: 400 })
    }

    const project = await createProject({ name, orderId, status })

    return NextResponse.json({ success: true, project }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create project' }, { status: 500 })
  }
}
