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

export async function GET() {
  try {
    const [accounts, invoices, bills, inventory] = await Promise.all([
      prisma.paymentAccount.findMany({ where: { status: 'Active' } }),
      prisma.invoice.findMany({ select: { amount: true, invoiceStatus: true } }),
      prisma.bill.findMany({ select: { amount: true, paidAmount: true, status: true } }),
      prisma.inventoryItem.findMany({ select: { quantity: true, costPrice: true } })
    ])

    const cashBank = accounts.reduce((s, a) => s + toNumber(a.balance), 0)

    const accountsReceivable = invoices.reduce((s, inv) => {
      const status = String(inv.invoiceStatus || '').toLowerCase()
      const amt = toNumber(inv.amount)
      return status === 'paid' ? s : s + amt
    }, 0)

    const accountsPayable = bills.reduce((s, b) => {
      const status = String(b.status || '').toUpperCase()
      const amt = toNumber(b.amount)
      const paid = toNumber(b.paidAmount)
      const due = Math.max(0, amt - paid)
      return status === 'PAID' ? s : s + due
    }, 0)

    const inventoryValue = inventory.reduce((s, it) => {
      const qty = toNumber(it.quantity)
      const cost = toNumber(it.costPrice)
      return s + qty * cost
    }, 0)

    const assets = {
      cashBank,
      accountsReceivable,
      inventory: inventoryValue,
      total: cashBank + accountsReceivable + inventoryValue
    }

    const liabilities = {
      accountsPayable,
      total: accountsPayable
    }

    const equity = assets.total - liabilities.total

    // Simple monthly series from invoices (AR) and bills (AP) for last 6 months could be added later

    return NextResponse.json({ assets, liabilities, equity })
  } catch (e) {
    return NextResponse.json({ assets: { cashBank: 0, accountsReceivable: 0, inventory: 0, total: 0 }, liabilities: { accountsPayable: 0, total: 0 }, equity: 0 })
  }
}
