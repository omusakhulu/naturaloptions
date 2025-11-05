import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = (searchParams.get('query') || '').trim()
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10) || 10, 50)

    if (!query) {
      return NextResponse.json({ success: true, products: [] })
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [{ name: { contains: query, mode: 'insensitive' } }, { sku: { contains: query, mode: 'insensitive' } }]
      },
      select: { id: true, wooId: true, name: true, sku: true },
      take: limit
    })

    return NextResponse.json({ success: true, products })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Search failed' }, { status: 500 })
  }
}
