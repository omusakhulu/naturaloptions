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
    const billsByVendor = await prisma.bill.groupBy({
      by: ['vendorId'],
      where: { billDate: { gte: from, lte: to } },
      _sum: { amount: true, paidAmount: true },
      _count: { _all: true }
    })

    const returnsByVendor = await prisma.purchaseReturn.groupBy({
      by: ['vendorId'],
      where: { date: { gte: from, lte: to } },
      _sum: { amount: true },
      _count: { _all: true }
    })

    const vendorIds = billsByVendor.map(b => b.vendorId)
    const vendors = vendorIds.length ? await prisma.vendor.findMany({ where: { id: { in: vendorIds } }, select: { id: true, name: true } }) : []

    const items = billsByVendor.map(b => {
      const v = vendors.find(x => x.id === b.vendorId)
      const ret = returnsByVendor.find(r => r.vendorId === b.vendorId)
      const totalPurchased = toNumber(b._sum.amount)
      const totalPaid = toNumber(b._sum.paidAmount)
      const balance = totalPurchased - totalPaid
      return {
        vendorId: b.vendorId,
        vendorName: v?.name || 'Vendor',
        bills: Number(b._count._all || 0),
        purchaseReturns: Number(ret?._count._all || 0),
        totalPurchased,
        totalPaid,
        balance
      }
    })

    const totals = items.reduce((s, r) => ({ totalPurchased: s.totalPurchased + r.totalPurchased, totalPaid: s.totalPaid + r.totalPaid, balance: s.balance + r.balance }), { totalPurchased: 0, totalPaid: 0, balance: 0 })

    return NextResponse.json({ range: { from, to }, items, totals })
  } catch (e) {
    return NextResponse.json({ range: { from, to }, items: [], totals: { totalPurchased: 0, totalPaid: 0, balance: 0 } })
  }
}
