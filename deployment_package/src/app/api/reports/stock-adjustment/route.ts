import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')

  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)
  const from = fromStr ? new Date(fromStr) : defaultFrom
  const to = toStr ? new Date(toStr) : today

  try {
    const movements = await prisma.productStockMovement.findMany({
      where: { 
        createdAt: { gte: from, lte: to },
        type: 'ADJUSTMENT'
      },
      include: {
        product: { select: { name: true, sku: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    const items = movements.map(m => ({
      id: m.id,
      date: m.createdAt.toISOString().slice(0,10),
      product: m.product?.name || 'Unknown',
      sku: m.product?.sku || 'N/A',
      type: m.type,
      quantity: m.quantity,
      beforeActual: m.beforeActual,
      afterActual: m.afterActual,
      locationId: m.locationId || 'N/A',
      reason: m.reason || 'N/A',
      userName: m.userName || 'System',
      reference: m.reference || ''
    }))
    
    const totals = {
      totalAdjustments: items.length,
      totalQuantityChange: items.reduce((sum, i) => sum + i.quantity, 0)
    }
    
    return NextResponse.json({ range: { from, to }, items, totals })
  } catch (e) {
    return NextResponse.json({ range: { from, to }, items: [], totals: { totalAdjustments: 0, totalQuantityChange: 0 } })
  }
}
