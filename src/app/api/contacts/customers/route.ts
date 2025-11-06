import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function toNumber(v: any): number {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v)
  return Number.isFinite(n) ? n : 0
}

export async function GET() {
  const byCustomerId: Record<string, any> = {}
  const byEmail: Record<string, any> = {}

  try {
    // Aggregate invoices for outstanding and last invoice date
    const invoices = await prisma.invoice.findMany({
      select: { customerId: true, customerEmail: true, amount: true, invoiceStatus: true, date: true }
    })

    for (const inv of invoices) {
      const keyId = inv.customerId != null ? String(inv.customerId) : undefined
      const keyEmail = (inv.customerEmail || '').toLowerCase()
      const target = keyId ? (byCustomerId[keyId] ||= { outstanding: 0, lastInvoice: null, orders: 0, lastOrderDate: null }) : (keyEmail ? (byEmail[keyEmail] ||= { outstanding: 0, lastInvoice: null, orders: 0, lastOrderDate: null }) : null)
      if (!target) continue

      const amt = toNumber(inv.amount)
      // Consider outstanding if invoice not fully paid
      const status = String(inv.invoiceStatus || '').toLowerCase()
      if (status && status !== 'paid') target.outstanding += amt

      const d = inv.date ? new Date(inv.date) : null
      if (d && (!target.lastInvoice || d > target.lastInvoice)) target.lastInvoice = d
    }

    // Aggregate orders for count and last order date
    const orders = await prisma.order.findMany({ select: { customerId: true, dateCreated: true } })
    for (const o of orders) {
      const keyId = o.customerId != null ? String(o.customerId) : undefined
      const target = keyId ? (byCustomerId[keyId] ||= { outstanding: 0, lastInvoice: null, orders: 0, lastOrderDate: null }) : null
      if (!target) continue
      target.orders += 1
      const d = o.dateCreated ? new Date(o.dateCreated) : null
      if (d && (!target.lastOrderDate || d > target.lastOrderDate)) target.lastOrderDate = d
    }

    return NextResponse.json({ byCustomerId, byEmail })
  } catch (e) {
    // Fallback: empty aggregates
    return NextResponse.json({ byCustomerId: {}, byEmail: {} })
  }
}
