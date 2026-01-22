import { NextResponse } from 'next/server'

import { createProject, getAllProjects } from '@/lib/db/projects'

export async function GET() {
  try {
    const projects = await getAllProjects()

    return NextResponse.json({ success: true, projects })
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
