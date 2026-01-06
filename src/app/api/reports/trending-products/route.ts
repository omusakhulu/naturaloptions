import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { wooClient } from '@/lib/woocommerce'

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
    // 1. Fetch POS Trending Products
    const posRows = await prisma.pOSSaleItem.groupBy({
      by: ['productId'],
      where: { sale: { saleDate: { gte: from, lte: to }, status: 'COMPLETED' } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 20
    })

    const productIds = posRows.map(r => r.productId)
    const products = productIds.length ? await prisma.product.findMany({ 
      where: { id: { in: productIds } }, 
      select: { id: true, name: true, wooId: true } 
    }) : []

    const trendingMap = new Map<string, { name: string; quantity: number }>()

    for (const r of posRows) {
      const p = products.find(prod => prod.id === r.productId)
      if (p) {
        trendingMap.set(p.name, { name: p.name, quantity: toNumber(r._sum.quantity) })
      }
    }

    // 2. Fetch WooCommerce Trending Products (from local Order model or API)
    // Using local Order model if it exists and has lineItems
    const wooOrders = await prisma.order.findMany({
      where: {
        dateCreated: { gte: from, lte: to },
        status: { in: ['completed', 'processing'] }
      },
      select: { lineItems: true }
    })

    for (const order of wooOrders) {
      try {
        const lineItems = JSON.parse(order.lineItems || '[]')
        for (const item of lineItems) {
          const name = item.name
          const qty = toNumber(item.quantity)
          const existing = trendingMap.get(name) || { name, quantity: 0 }
          existing.quantity += qty
          trendingMap.set(name, existing)
        }
      } catch (err) {
        console.error('Error parsing order line items:', err)
      }
    }

    // Convert map to sorted array
    const items = Array.from(trendingMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(item => ({
        productName: item.name,
        quantity: item.quantity
      }))

    return NextResponse.json({ range: { from, to }, items })
  } catch (e: any) {
    console.error('Trending Products Report Error:', e)
    return NextResponse.json({ range: { from, to }, items: [], error: e.message })
  }
}
