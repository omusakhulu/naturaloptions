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
    const [posPayments, wooOrders] = await Promise.all([
      prisma.payment.findMany({
        where: { createdAt: { gte: from, lte: to }, status: 'COMPLETED' },
        include: { sale: { select: { saleNumber: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.findMany({
        where: {
          datePaid: { gte: from, lte: to },
          status: { in: ['completed', 'processing'] }
        },
        select: { orderNumber: true, total: true, paymentMethodTitle: true, datePaid: true, id: true }
      })
    ])

    const items = [
      ...posPayments.map(p => ({
        id: p.id,
        source: 'POS',
        saleNumber: p.sale?.saleNumber || 'N/A',
        method: String(p.paymentMethod),
        date: p.createdAt.toISOString().slice(0, 10),
        amount: toNumber(p.amount),
        reference: p.reference || null
      })),
      ...wooOrders.map(o => ({
        id: o.id,
        source: 'WooCommerce',
        saleNumber: o.orderNumber,
        method: o.paymentMethodTitle || 'Online',
        date: o.datePaid?.toISOString().slice(0, 10) || 'N/A',
        amount: toNumber(o.total),
        reference: 'WC-' + o.id
      }))
    ].sort((a, b) => b.date.localeCompare(a.date))

    const totals = items.reduce((s, r) => ({ amount: s.amount + r.amount, count: s.count + 1 }), { amount: 0, count: 0 })

    const byMethodMap = new Map<string, number>()
    for (const it of items) byMethodMap.set(it.method, (byMethodMap.get(it.method) || 0) + it.amount)
    const byMethod = Array.from(byMethodMap.entries()).map(([method, amount]) => ({ method, amount }))

    return NextResponse.json({ range: { from, to }, items, totals, byMethod })
  } catch (e: any) {
    console.error('Sell Payment Report Error:', e)
    return NextResponse.json({ range: { from, to }, items: [], totals: { amount: 0, count: 0 }, byMethod: [] })
  }
}
