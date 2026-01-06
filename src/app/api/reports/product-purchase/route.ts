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
    const bills = await prisma.bill.findMany({
      where: { billDate: { gte: from, lte: to } },
      include: { vendor: { select: { name: true } } }
    })

    const items = bills.map(b => ({
      id: b.id,
      billNumber: b.billNumber,
      vendor: b.vendor.name,
      date: b.billDate.toISOString().slice(0, 10),
      amount: toNumber(b.amount),
      status: b.status,
      reference: b.reference || ''
    }))

    const totals = {
      totalPurchases: items.length,
      totalAmount: items.reduce((sum, i) => sum + i.amount, 0)
    }

    return NextResponse.json({ range: { from, to }, items, totals })
  } catch (e) {
    return NextResponse.json({
      range: { from, to },
      items: [],
      totals: { totalPurchases: 0, totalAmount: 0 }
    })
  }
}
