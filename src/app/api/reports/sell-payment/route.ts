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
    const payments = await prisma.payment.findMany({
      where: { paymentDate: { gte: from, lte: to } },
      select: { id: true, amount: true, paymentMethod: true, paymentDate: true, reference: true, sale: { select: { saleNumber: true } } },
      orderBy: { paymentDate: 'desc' }
    })

    const items = payments.map(p => ({ id: p.id, saleNumber: p.sale?.saleNumber || undefined, method: String(p.paymentMethod), date: (p.paymentDate as any as Date).toISOString().slice(0,10), amount: toNumber(p.amount), reference: p.reference || null }))

    const totals = items.reduce((s, r) => ({ amount: s.amount + r.amount, count: s.count + 1 }), { amount: 0, count: 0 })

    const byMethodMap = new Map<string, number>()
    for (const it of items) byMethodMap.set(it.method, (byMethodMap.get(it.method) || 0) + it.amount)
    const byMethod = Array.from(byMethodMap.entries()).map(([method, amount]) => ({ method, amount }))

    return NextResponse.json({ range: { from, to }, items, totals, byMethod })
  } catch (e) {
    return NextResponse.json({ range: { from, to }, items: [], totals: { amount: 0, count: 0 }, byMethod: [] })
  }
}
