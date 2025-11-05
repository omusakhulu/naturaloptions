import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// POST - Mark all notifications as read or unread
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Update all notifications
    await prisma.notification.updateMany({
      where: {
        userId: user.id
      },
      data: {
        read
      }
    })

    return NextResponse.json({ success: true, message: `All notifications marked as ${read ? 'read' : 'unread'}` })
  } catch (error) {
    console.error('Error marking all notifications:', error)
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
