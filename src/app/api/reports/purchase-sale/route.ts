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
  const customerIdStr = searchParams.get('customerId')
  const vendorIdStr = searchParams.get('vendorId')

  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)
  const from = fromStr ? new Date(fromStr) : defaultFrom
  const to = toStr ? new Date(toStr) : today

  try {
    const invoiceWhere: any = { date: { gte: from, lte: to } }
    if (customerIdStr) invoiceWhere.customerId = Number(customerIdStr)

    const billWhere: any = { billDate: { gte: from, lte: to } }
    if (vendorIdStr) billWhere.vendorId = Number(vendorIdStr)

    const [invoices, bills, salesRetAgg, purchaseRetAgg] = await Promise.all([
      prisma.invoice.findMany({
        where: invoiceWhere,
        select: { date: true, amount: true }
      }),
      prisma.bill.findMany({
        where: billWhere,
        select: { billDate: true, amount: true }
      }),
      prisma.salesReturn.aggregate({ where: { date: { gte: from, lte: to } }, _sum: { amount: true } }),
      prisma.purchaseReturn.aggregate({ where: { date: { gte: from, lte: to } }, _sum: { amount: true } })
    ])

    const salesByDay: Record<string, number> = {}
    for (const inv of invoices) {
      const key = ymd(inv.date as unknown as Date)
      salesByDay[key] = (salesByDay[key] || 0) + toNumber((inv as any).amount)
    }

    const purchasesByDay: Record<string, number> = {}
    for (const b of bills) {
      const key = ymd((b as any).billDate)
      purchasesByDay[key] = (purchasesByDay[key] || 0) + toNumber((b as any).amount)
    }

    const byDates = Array.from(new Set([...Object.keys(salesByDay), ...Object.keys(purchasesByDay)])).sort()

    const salesByPeriod = byDates.map(d => ({ date: d, total: salesByDay[d] || 0 }))
    const purchasesByPeriod = byDates.map(d => ({ date: d, total: purchasesByDay[d] || 0 }))

    const salesTotal = Object.values(salesByDay).reduce((s, v) => s + v, 0)
    const purchasesTotal = Object.values(purchasesByDay).reduce((s, v) => s + v, 0)

    const salesReturns = toNumber(salesRetAgg._sum.amount)
    const purchaseReturns = toNumber(purchaseRetAgg._sum.amount)

    return NextResponse.json({
      range: { from, to },
      sales: { total: salesTotal, byPeriod: salesByPeriod },
      purchases: { total: purchasesTotal, byPeriod: purchasesByPeriod },
      adjustments: { salesReturns, purchaseReturns },
      net: { sales: salesTotal - salesReturns, purchases: purchasesTotal - purchaseReturns },
      filters: {
        customerId: customerIdStr ? Number(customerIdStr) : null,
        vendorId: vendorIdStr ? Number(vendorIdStr) : null
      }
    })
  } catch (e) {
    return NextResponse.json({
      range: { from, to },
      sales: { total: 0, byPeriod: [] },
      purchases: { total: 0, byPeriod: [] },
      adjustments: { salesReturns: 0, purchaseReturns: 0 },
      net: { sales: 0, purchases: 0 },
      filters: { customerId: null, vendorId: null }
    })
  }
}
