import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import prisma from '@/lib/prisma'
import { UserRole } from '@prisma/client'

import { authOptions } from '@/config/auth'
import { canChangeRole, isSuperAdmin } from '@/lib/auth-utils'

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const { id } = params
    const { role } = await request.json()

    // Validate role
    const finalRole = String(role || '').trim().toUpperCase() as UserRole
    if (!Object.values(UserRole).includes(finalRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const sessionUserId = (session.user as any)?.id
    const sessionRole = (session.user as any)?.role

    if (!canChangeRole(session as any, finalRole as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prevent accidental self-demotion for super admins.
    if (sessionUserId && String(sessionUserId) === String(id) && sessionRole === 'SUPER_ADMIN' && finalRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'You cannot change your own SUPER_ADMIN role' }, { status: 400 })
    }

    // Only super admin can assign super admin (belt & suspenders).
    if (finalRole === 'SUPER_ADMIN' && !isSuperAdmin(session as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: finalRole },
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
