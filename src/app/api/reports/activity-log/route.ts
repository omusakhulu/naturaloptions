import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')
  const userId = searchParams.get('userId')
  const entityType = searchParams.get('entityType')

  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)
  const from = fromStr ? new Date(fromStr) : defaultFrom
  const to = toStr ? new Date(toStr) : today

  try {
    const where: any = {
      createdAt: { gte: from, lte: to }
    }

    if (userId) {
      where.performedById = userId
    }

    if (entityType) {
      where.entityType = entityType
    }

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        performedBy: { select: { name: true, image: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    const items = logs.map(log => ({
      id: log.id,
      user: log.performedBy?.name || 'System',
      userImage: log.performedBy?.image,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      description: log.description,
      icon: log.icon || 'tabler-activity',
      color: log.color || 'primary',
      date: log.createdAt.toISOString()
    }))

    return NextResponse.json({ range: { from, to }, items })
  } catch (e: any) {
    console.error('Activity Log Report Error:', e)
    return NextResponse.json({ range: { from, to }, items: [] })
  }
}
