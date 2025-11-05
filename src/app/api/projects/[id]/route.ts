import { NextResponse } from 'next/server'

import { getProjectById, updateProject, deleteProject } from '@/lib/db/projects'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const project = await getProjectById(id)

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, project })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch project' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, status } = body

    const project = await updateProject(id, { name, status })

    return NextResponse.json({ success: true, project })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await deleteProject(id)

    return NextResponse.json({ success: true, message: 'Project deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete project' }, { status: 500 })
  }
}
