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
    // 1. POS Sales Items
    const posRows = await prisma.pOSSaleItem.groupBy({
      by: ['productId'],
      where: { sale: { saleDate: { gte: from, lte: to }, status: 'COMPLETED' } },
      _sum: { quantity: true, total: true }
    })

    // 2. WooCommerce Orders (from local Order model)
    const wooOrders = await prisma.order.findMany({
      where: {
        dateCreated: { gte: from, lte: to },
        status: { in: ['completed', 'processing'] }
      },
      select: { lineItems: true }
    })

    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()

    // Process POS items
    const posProductIds = posRows.map(r => r.productId)
    const posProducts = posProductIds.length ? await prisma.product.findMany({
      where: { id: { in: posProductIds } },
      select: { id: true, name: true }
    }) : []

    for (const r of posRows) {
      const p = posProducts.find(prod => prod.id === r.productId)
      const name = p?.name || 'Unknown Product'
      const qty = toNumber(r._sum.quantity)
      const total = toNumber(r._sum.total)
      
      const existing = productMap.get(name) || { name, quantity: 0, revenue: 0 }
      existing.quantity += qty
      existing.revenue += total
      productMap.set(name, existing)
    }

    // Process WooCommerce items
    for (const order of wooOrders) {
      try {
        const lineItems = JSON.parse(order.lineItems || '[]')
        for (const item of lineItems) {
          const name = item.name
          const qty = toNumber(item.quantity)
          const total = toNumber(item.total)
          
          const existing = productMap.get(name) || { name, quantity: 0, revenue: 0 }
          existing.quantity += qty
          existing.revenue += total
          productMap.set(name, existing)
        }
      } catch (err) {
        console.error('Error parsing order line items:', err)
      }
    }

    const items = Array.from(productMap.entries()).map(([name, data]) => ({
      productId: name, // Using name as ID for unified view
      productName: name,
      quantity: data.quantity,
      revenue: data.revenue,
      grossProfit: data.revenue * 0.3 // Estimate 30% GP as cost data is not fully linked
    }))

    const totals = items.reduce((s, r) => ({
      quantity: s.quantity + r.quantity,
      revenue: s.revenue + r.revenue,
      grossProfit: s.grossProfit + r.grossProfit
    }), { quantity: 0, revenue: 0, grossProfit: 0 })

    return NextResponse.json({ range: { from, to }, items, totals })
  } catch (e: any) {
    console.error('Product Sell Report Error:', e)
    return NextResponse.json({ range: { from, to }, items: [], totals: { quantity: 0, revenue: 0, grossProfit: 0 } })
  }
}
