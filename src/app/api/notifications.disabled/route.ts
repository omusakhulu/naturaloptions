import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - Fetch notifications for logged-in user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly ? { read: false } : {})
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Format notifications for the frontend
    const formattedNotifications = notifications.map(notification => {
      const timeAgo = getTimeAgo(notification.createdAt)
      
      return {
        id: notification.id,
        title: notification.title,
        subtitle: notification.subtitle,
        time: timeAgo,
        read: notification.read,
        avatarImage: notification.avatarImage,
        avatarIcon: notification.avatarIcon,
        avatarText: notification.avatarText,
        avatarColor: notification.avatarColor,
        link: notification.link,
        type: notification.type,
        metadata: notification.metadata ? JSON.parse(notification.metadata) : {}
      }
    })

    return NextResponse.json(formattedNotifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new notification
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, title, subtitle, message, type, avatarIcon, avatarColor, link, metadata } = body

    if (!userId || !title) {
      return NextResponse.json({ error: 'userId and title are required' }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        subtitle,
        message,
        type: type || 'INFO',
        avatarIcon: avatarIcon || 'tabler-bell',
        avatarColor: avatarColor || 'primary',
        link,
        metadata: metadata ? JSON.stringify(metadata) : '{}'
      }
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  if (months < 12) return `${months}mo ago`
  
  return `${years}y ago`
}
