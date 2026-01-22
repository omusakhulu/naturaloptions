import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/config/auth'

export const runtime = 'nodejs'

/**
 * Get stock movements for a product
 * GET /api/stock/movements?productId=xxx&limit=50
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')

    const where: any = {}
    if (productId) where.productId = productId
    if (type) where.type = type

    const movements = await prisma.productStockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      movements,
      count: movements.length
    })
  } catch (error: any) {
    console.error('Get stock movements error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get stock movements' },
      { status: 500 }
    )
  }
}
