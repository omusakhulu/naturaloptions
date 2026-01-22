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

    const items = bills.map(b => {
      const due = b.dueDate || b.billDate
      const days = Math.floor((asOf.getTime() - new Date(due).getTime()) / (1000 * 60 * 60 * 24))
      const buck = bucket(days)
      const outstanding = toNumber(b.amount) - toNumber(b.paidAmount)
      return {
        id: b.id,
        number: b.billNumber,
        vendor: b.vendor?.name || 'Vendor',
        date: b.billDate,
        dueDate: due,
        status: b.status,
        daysPastDue: days,
        bucket: buck,
        outstanding
      }
    }).filter(it => toNumber(it.outstanding) > 0)

    const grandTotal = items.reduce((s, it) => s + toNumber(it.outstanding), 0)

    return NextResponse.json({ asOf, items, grandTotal })
  } catch (e) {
    return NextResponse.json({ asOf, items: [], grandTotal: 0 })
  }
}
