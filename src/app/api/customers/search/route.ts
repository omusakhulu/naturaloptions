import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, customers: [] })
    }

    if (!q) {
      const customers = await prisma.customer.findMany({ take: 10, orderBy: { syncedAt: 'desc' } })
      return NextResponse.json({ success: true, customers })
    }

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          // Phone or company may be stored inside JSON strings; do a string contains match
          { billingAddress: { contains: q, mode: 'insensitive' } },
          { shippingAddress: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 20,
      orderBy: { syncedAt: 'desc' }
    })

    return NextResponse.json({ success: true, customers })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Search failed' }, { status: 500 })
  }
}
