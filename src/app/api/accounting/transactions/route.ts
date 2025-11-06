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

function normalizeDate(d: any): string {
  const dt = new Date(d)
  return dt.toISOString().slice(0, 10)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const after = searchParams.get('after')
  const before = searchParams.get('before')
  const q = searchParams.get('q') || ''
  const category = (searchParams.get('category') || 'sales-payments').toLowerCase()

  try {
    let items: any[] = []

    if (category === 'sales-payments') {
      const where: any = {}
      if (after || before) {
        where.paymentDate = {}
        if (after) where.paymentDate.gte = new Date(after)
        if (before) where.paymentDate.lte = new Date(before)
      }
      if (q) {
        where.OR = [
          { reference: { contains: q, mode: 'insensitive' } },
          { sale: { saleNumber: { contains: q, mode: 'insensitive' } } }
        ]
      }
      const rows = await prisma.payment.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          paymentDate: true,
          reference: true,
          sale: { select: { saleNumber: true, customer: { select: { firstName: true, lastName: true } } } }
        }
      })
      items = rows.map(r => ({
        id: r.id,
        date: r.paymentDate,
        ref: r.reference || r.sale?.saleNumber || '-',
        amount: toNumber(r.amount),
        paymentType: 'Sell',
        method: r.paymentMethod,
        description: 'Sales payment',
        counterpart: r.sale?.customer ? `${r.sale.customer.firstName || ''} ${r.sale.customer.lastName || ''}`.trim() : 'Customer'
      }))
    } else if (category === 'expenses') {
      const where: any = {}
      if (after || before) {
        where.date = {}
        if (after) where.date.gte = new Date(after)
        if (before) where.date.lte = new Date(before)
      }
      if (q) {
        where.OR = [
          { category: { contains: q, mode: 'insensitive' } },
          { note: { contains: q, mode: 'insensitive' } }
        ]
      }
      const rows = await prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        select: { id: true, amount: true, date: true, note: true, category: true, account: { select: { name: true } } }
      })
      items = rows.map(r => ({
        id: r.id,
        date: r.date,
        ref: r.category,
        amount: toNumber(r.amount),
        paymentType: 'Expense',
        method: r.account?.name || '-',
        description: r.note || 'Expense',
        counterpart: r.category
      }))
    } else if (category === 'purchases') {
      const where: any = {}
      if (after || before) {
        where.billDate = {}
        if (after) where.billDate.gte = new Date(after)
        if (before) where.billDate.lte = new Date(before)
      }
      if (q) {
        where.OR = [
          { billNumber: { contains: q, mode: 'insensitive' } },
          { reference: { contains: q, mode: 'insensitive' } },
          { vendor: { name: { contains: q, mode: 'insensitive' } } }
        ]
      }
      const rows = await prisma.bill.findMany({
        where,
        orderBy: { billDate: 'desc' },
        select: { id: true, billNumber: true, billDate: true, amount: true, vendor: { select: { name: true } }, reference: true }
      })
      items = rows.map(r => ({
        id: r.id,
        date: r.billDate,
        ref: r.billNumber || r.reference || '-',
        amount: toNumber(r.amount),
        paymentType: 'Purchase',
        method: 'Bill',
        description: r.reference || 'Vendor bill',
        counterpart: r.vendor?.name || 'Vendor'
      }))
    } else if (category === 'purchase-payments') {
      const where: any = { paidAmount: { gt: 0 } }
      if (after || before) {
        where.billDate = {}
        if (after) where.billDate.gte = new Date(after)
        if (before) where.billDate.lte = new Date(before)
      }
      if (q) {
        where.OR = [
          { billNumber: { contains: q, mode: 'insensitive' } },
          { reference: { contains: q, mode: 'insensitive' } },
          { vendor: { name: { contains: q, mode: 'insensitive' } } }
        ]
      }
      const rows = await prisma.bill.findMany({
        where,
        orderBy: { billDate: 'desc' },
        select: { id: true, billNumber: true, billDate: true, paidAmount: true, vendor: { select: { name: true } }, reference: true }
      })
      items = rows.map(r => ({
        id: r.id,
        date: r.billDate,
        ref: r.billNumber || r.reference || '-',
        amount: toNumber(r.paidAmount),
        paymentType: 'Purchase Payment',
        method: 'Bill Payment',
        description: r.reference || 'Bill payment',
        counterpart: r.vendor?.name || 'Vendor'
      }))
    } else if (category === 'woo-sales') {
      // WooCommerce sales from mirrored Order table
      const where: any = { status: { equals: 'completed', mode: 'insensitive' }, datePaid: { not: null } }
      if (after || before) {
        where.dateCreated = {}
        if (after) where.dateCreated.gte = new Date(after)
        if (before) where.dateCreated.lte = new Date(before)
      }
      if (q) {
        where.OR = [
          { orderNumber: { contains: q, mode: 'insensitive' } },
          { status: { contains: q, mode: 'insensitive' } }
        ]
      }
      const rows = await prisma.order.findMany({
        where,
        orderBy: { dateCreated: 'desc' },
        select: { id: true, orderNumber: true, dateCreated: true, total: true, status: true }
      })
      items = rows.map(r => ({
        id: r.id,
        date: r.dateCreated,
        ref: r.orderNumber,
        amount: toNumber(r.total),
        paymentType: 'Woo Sale',
        method: r.status,
        description: 'WooCommerce Order',
        status: r.status,
        counterpart: 'Customer'
      }))
    }

    // Totals and simple daily series for chart
    const totals = items.reduce((s, r) => ({ count: s.count + 1, amount: s.amount + toNumber(r.amount) }), { count: 0, amount: 0 })
    const byDay: Record<string, number> = {}
    for (const it of items) {
      const d = normalizeDate(it.date)
      byDay[d] = (byDay[d] || 0) + toNumber(it.amount)
    }
    const series = Object.keys(byDay).sort().map(d => ({ date: d, amount: byDay[d] }))

    return NextResponse.json({ items, totals, series })
  } catch (e) {
    return NextResponse.json({ items: [], totals: { count: 0, amount: 0 }, series: [] })
  }
}
