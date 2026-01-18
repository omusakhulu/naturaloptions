import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        image: true,
        emailVerified: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user')
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json().catch(() => ({}))

    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : ''
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''

    const name = (fullName || `${firstName} ${lastName}`.trim() || undefined) as string | undefined

    const emailRaw = typeof body.email === 'string' ? body.email : typeof body.billingEmail === 'string' ? body.billingEmail : ''
    const email = emailRaw ? String(emailRaw).trim().toLowerCase() : undefined

    const statusRaw = typeof body.status === 'string' ? body.status.trim().toLowerCase() : undefined
    const active = statusRaw ? statusRaw === 'active' : typeof body.active === 'boolean' ? body.active : undefined

    const roleRaw = typeof body.role === 'string' ? body.role.trim().toUpperCase() : undefined
    const role = roleRaw && Object.values(UserRole).includes(roleRaw as UserRole) ? (roleRaw as UserRole) : undefined

    if (!name && !email && typeof active !== 'boolean' && !role) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }

      const existing = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id }
        },
        select: { id: true }
      })

      if (existing) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        ...(typeof active === 'boolean' ? { active } : {}),
        ...(role ? { role } : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        image: true,
        emailVerified: true,
        createdAt: true
      }
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error('Error updating user')
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const sessionUserId = (session.user as any)?.id
    if (sessionUserId && String(sessionUserId) === String(id)) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } })
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    try {
      await prisma.user.delete({ where: { id } })
      return NextResponse.json({ success: true })
    } catch (error) {
      // If user is referenced by POS sales or other FK constraints, fall back to soft-delete.
      // (We cannot hard delete employees referenced by transactions.)
      try {
        await prisma.session.deleteMany({ where: { userId: id } })
      } catch {
        // ignore
      }

      const anonymizedEmail = `deleted+${id}@deleted.local`

      try {
        await prisma.user.update({
          where: { id },
          data: {
            active: false,
            name: 'Deleted User',
            email: anonymizedEmail,
            password: null,
            image: null
          }
        })

        return NextResponse.json({
          success: true,
          softDeleted: true,
          message: 'User could not be hard deleted because of linked transactions. The account was deactivated instead.'
        })
      } catch {
        console.error('Error deleting user')
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
      }
    }
  } catch {
    console.error('Error deleting user')
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
