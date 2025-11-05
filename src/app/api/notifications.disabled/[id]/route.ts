import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// PATCH - Mark notification as read/unread
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { read } = body

    if (typeof read !== 'boolean') {
      return NextResponse.json({ error: 'read field is required and must be boolean' }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update notification
    const notification = await prisma.notification.updateMany({
      where: {
        id,
        userId: user.id
      },
      data: {
        read
      }
    })

    if (notification.count === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Notification updated' })
  } catch (error) {
    console.error('Error updating notification:', error)
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a notification
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete notification
    const notification = await prisma.notification.deleteMany({
      where: {
        id,
        userId: user.id
      }
    })

    if (notification.count === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Notification deleted' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
