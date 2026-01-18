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

function safeParse(jsonStr: any): any[] {
  if (!jsonStr) return []
  try {
    if (typeof jsonStr === 'string') return JSON.parse(jsonStr)
    if (Array.isArray(jsonStr)) return jsonStr
    return []
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')
  const q = (searchParams.get('q') || '').toLowerCase()

  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)
  const from = fromStr ? new Date(fromStr) : defaultFrom
  const to = toStr ? new Date(toStr) : today

  try {
    const bySku = new Map<string, { sku: string; name: string; quantity: number; amount: number }>()

    const posRows = await prisma.pOSSaleItem.groupBy({
      by: ['productId'],
      where: { sale: { saleDate: { gte: from, lte: to }, status: 'COMPLETED' } },
      _sum: { quantity: true, total: true }
    })

    const posProductIds = posRows.map(r => r.productId)
    const posProducts = posProductIds.length
      ? await prisma.product.findMany({ where: { id: { in: posProductIds } }, select: { id: true, name: true, sku: true } })
      : []

    for (const r of posRows) {
      const p = posProducts.find(pp => pp.id === r.productId)
      const sku = String(p?.sku || '').trim()
      const name = String(p?.name || 'Item')
      const qty = toNumber(r._sum.quantity)
      const total = toNumber(r._sum.total)
      const key = sku || name
      const prev = bySku.get(key) || { sku, name, quantity: 0, amount: 0 }
      prev.quantity += qty
      prev.amount += total
      bySku.set(key, prev)
    }

    const wooOrders = await prisma.order.findMany({
      where: {
        dateCreated: { gte: from, lte: to },
        status: { in: ['completed', 'processing'] }
      },
      select: { lineItems: true }
    })

    for (const order of wooOrders) {
      const items = safeParse((order as any).lineItems)
      for (const li of items) {
        const sku = String(li?.sku || '').trim() || String(li?.product_id || '')
        const name = String(li?.name || 'Item')
        const qty = toNumber(li?.quantity)
        const total = toNumber(li?.total)
        const key = sku || name
        const prev = bySku.get(key) || { sku, name, quantity: 0, amount: 0 }
        prev.quantity += qty
        prev.amount += total
        bySku.set(key, prev)
      }
    }

    let items = Array.from(bySku.values())

    if (q) {
      items = items.filter(it => (it.sku || '').toLowerCase().includes(q) || (it.name || '').toLowerCase().includes(q))
    }

    items.sort((a, b) => b.quantity - a.quantity)

    const totals = items.reduce((s, it) => ({ quantity: s.quantity + toNumber(it.quantity), amount: s.amount + toNumber(it.amount) }), { quantity: 0, amount: 0 })

    return NextResponse.json({ range: { from, to }, items, totals })
  } catch (e) {
    return NextResponse.json({ range: { from, to }, items: [], totals: { quantity: 0, amount: 0 } })
  }
}
