import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { EntityType } from '@prisma/client'
import { authOptions } from '@/config/auth'
import prisma from '@/lib/prisma'

// GET /api/activity-logs - Fetch activity logs
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (userId) {
      where.OR = [{ performedById: userId }, { relatedUserId: userId }]
    }

    if (entityType) {
      where.entityType = entityType
    }

    if (entityId) {
      where.entityId = entityId
    }

    const activities = await prisma.activityLog.findMany({
      where,
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        relatedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json({ success: true, activities })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 })
  }
}

// POST /api/activity-logs - Create new activity log
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const performedById = session.user.id

    if (!performedById) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { relatedUserId, entityType, entityId, action, description, icon, color, metadata } = body

    if (!entityType || !entityId || !action || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const activity = await prisma.activityLog.create({
      data: {
        performedBy: { connect: { id: performedById } },
        ...(relatedUserId ? { relatedUser: { connect: { id: String(relatedUserId) } } } : {}),
        entityType: entityType as EntityType,
        entityId: String(entityId),
        action: String(action),
        description: String(description),
        icon: icon || null,
        color: color || 'primary',
        metadata: metadata ? JSON.stringify(metadata) : '{}'
      },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        relatedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, activity })
  } catch (error) {
    console.error('Error creating activity log:', error)
    return NextResponse.json({ error: 'Failed to create activity log' }, { status: 500 })
  }
}
