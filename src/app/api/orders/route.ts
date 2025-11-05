import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, orders: [], message: 'Database not configured' })
    }

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const takeParam = parseInt(searchParams.get('take') || '20', 10)
    const take = Number.isFinite(takeParam) && takeParam > 0 && takeParam <= 100 ? takeParam : 20
    const deliverable = (searchParams.get('deliverable') || 'true').toLowerCase() !== 'false'

    const where: any = {
      AND: [] as any[]
    }

    if (deliverable) {
      where.AND.push({ status: { in: ['processing', 'completed'] } })
    }

    if (q.length > 0) {
      const maybeNum = Number(q.replace(/[^0-9]/g, ''))
      const or: any[] = [
        { orderNumber: { contains: q, mode: 'insensitive' as const } },
        { customer: { contains: q, mode: 'insensitive' as const } },
        { billingAddress: { contains: q, mode: 'insensitive' as const } },
        { shippingAddress: { contains: q, mode: 'insensitive' as const } }
      ]

      if (Number.isFinite(maybeNum)) {
        or.push({ wooId: maybeNum })
      }

      where.AND.push({ OR: or })
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { dateCreated: 'desc' },
      take,
      select: {
        id: true,
        wooId: true,
        orderNumber: true,
        status: true,
        total: true,
        lineItems: true,
        customer: true,
        billingAddress: true,
        shippingAddress: true,
        dateCreated: true
      }
    })

    return NextResponse.json({ success: true, orders })
  } catch (error) {
    console.error('Orders search error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search orders' },
      { status: 500 }
    )
  }
}
