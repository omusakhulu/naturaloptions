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

function bucket(days: number) {
  if (days <= 0) return 'current'
  if (days <= 30) return '1-30'
  if (days <= 60) return '31-60'
  if (days <= 90) return '61-90'
  return '90+'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const asOfStr = searchParams.get('asOf')
  const asOf = asOfStr ? new Date(asOfStr) : new Date()

  try {
    const bills = await prisma.bill.findMany({
      where: { NOT: { status: 'PAID' } },
      orderBy: { billDate: 'desc' },
      select: { id: true, billNumber: true, amount: true, paidAmount: true, billDate: true, dueDate: true, vendor: { select: { name: true } }, status: true }
    })

    const totals: Record<string, number> = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }

    for (const b of bills) {
      const due = b.dueDate || b.billDate
      const days = Math.floor((asOf.getTime() - new Date(due).getTime()) / (1000 * 60 * 60 * 24))
      const buck = bucket(days)
      const outstanding = toNumber(b.amount) - toNumber(b.paidAmount)
      if (outstanding > 0) totals[buck] += outstanding
    }

    const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0)

    return NextResponse.json({ asOf, totals, grandTotal })
  } catch (e) {
    return NextResponse.json({ asOf, totals: { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }, grandTotal: 0 })
  }
}
