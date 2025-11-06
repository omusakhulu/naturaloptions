import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function toNumber(v: any): number {
  if (v == null) return 0
  if (typeof v === 'string') {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : 0
  }
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')

  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)
  const from = fromStr ? new Date(fromStr) : defaultFrom
  const to = toStr ? new Date(toStr) : today

  try {
    const rows = await prisma.pOSSaleItem.groupBy({
      by: ['productId'],
      where: { sale: { saleDate: { gte: from, lte: to } } },
      _sum: { quantity: true, total: true }
    })
    const productIds = rows.map(r => r.productId)
    const products = productIds.length ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }) : []
    const items = rows.map(r => {
      const qty = toNumber(r._sum.quantity)
      const revenue = toNumber(r._sum.total)
      return {
        productId: r.productId as string,
        productName: products.find(p => p.id === r.productId)?.name || 'Product',
        quantity: qty,
        revenue,
        grossProfit: 0 // Schema lacks product cost linkage for GP; consider journal-based COGS for accurate GP
      }
    })
    const totals = items.reduce((s, r) => ({ quantity: s.quantity + r.quantity, revenue: s.revenue + r.revenue, grossProfit: s.grossProfit + r.grossProfit }), { quantity: 0, revenue: 0, grossProfit: 0 })
    return NextResponse.json({ range: { from, to }, items, totals })
  } catch (e) {
    return NextResponse.json({ range: { from, to }, items: [], totals: { quantity: 0, revenue: 0, grossProfit: 0 } })
  }
}
