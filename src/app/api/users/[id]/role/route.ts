import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const { id } = params
    const { role } = await request.json()

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES', 'USER']
    
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}
