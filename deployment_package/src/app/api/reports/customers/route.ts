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

function ymd(d: Date): string {
  const dt = new Date(d)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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
    const sales = await prisma.pOSSale.groupBy({
      by: ['customerId'],
      where: { saleDate: { gte: from, lte: to }, customerId: { not: null } },
      _sum: { totalAmount: true },
      _count: { _all: true }
    })

    const custIds = sales.map(s => s.customerId).filter(Boolean) as string[]
    const customers = custIds.length ? await prisma.pOSCustomer.findMany({ where: { id: { in: custIds } }, select: { id: true, firstName: true, lastName: true, email: true, loyaltyPoints: true } }) : []

    const items = sales.map(s => {
      const c = customers.find(x => x.id === s.customerId)
      return {
        id: s.customerId as string,
        name: `${c?.firstName || ''} ${c?.lastName || ''}`.trim() || 'Customer',
        email: c?.email || '',
        loyaltyPoints: Number((c as any)?.loyaltyPoints || 0),
        salesCount: Number(s._count._all || 0),
        totalSpent: toNumber(s._sum.totalAmount)
      }
    })

    const byDayAgg = await prisma.pOSSale.groupBy({
      by: ['saleDate'],
      where: { saleDate: { gte: from, lte: to } },
      _sum: { totalAmount: true }
    })
    const series = byDayAgg.map(d => ({ date: ymd(d.saleDate as unknown as Date), amount: toNumber(d._sum.totalAmount) }))

    const totals = items.reduce((s, r) => ({ customers: s.customers + 1, sales: s.sales + r.salesCount, amount: s.amount + r.totalSpent }), { customers: 0, sales: 0, amount: 0 })

    return NextResponse.json({ range: { from, to }, items, series, totals })
  } catch (e) {
    return NextResponse.json({ range: { from, to }, items: [], series: [], totals: { customers: 0, sales: 0, amount: 0 } })
  }
}
