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
    const salesByRep = await prisma.pOSSale.groupBy({
      by: ['employeeId'],
      where: {
        saleDate: { gte: from, lte: to },
        status: 'COMPLETED'
      },
      _sum: { totalAmount: true },
      _count: { _all: true }
    })

    const employeeIds = salesByRep.map(s => s.employeeId)
    const employees = await prisma.user.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, name: true, email: true }
    })

    const items = salesByRep.map(s => {
      const emp = employees.find(e => e.id === s.employeeId)
      return {
        id: s.employeeId,
        name: emp?.name || 'Unknown Rep',
        email: emp?.email || '',
        totalSales: s._count._all,
        totalRevenue: toNumber(s._sum.totalAmount),
        avgSaleValue: s._count._all > 0 ? toNumber(s._sum.totalAmount) / s._count._all : 0
      }
    })

    const totals = items.reduce((s, r) => ({
      sales: s.sales + r.totalSales,
      amount: s.amount + r.totalRevenue
    }), { sales: 0, amount: 0 })

    return NextResponse.json({ range: { from, to }, items, totals })
  } catch (e: any) {
    console.error('Sales Representative Report Error:', e)
    return NextResponse.json({ range: { from, to }, items: [], totals: { sales: 0, amount: 0 } })
  }
}
