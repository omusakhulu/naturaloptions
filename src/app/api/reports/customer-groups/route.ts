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
    // Group customers by loyalty points tiers since CustomerGroup model doesn't exist
    const customers = await prisma.pOSCustomer.findMany({
      include: {
        posSales: {
          where: {
            saleDate: { gte: from, lte: to },
            status: 'COMPLETED'
          }
        }
      }
    })

    // Create groups based on loyalty points
    const groups = new Map<string, { customers: number; totalSpent: number; salesCount: number }>()
    
    for (const customer of customers) {
      let group = 'Regular'
      const points = customer.loyaltyPoints
      
      if (points >= 1000) group = 'VIP'
      else if (points >= 500) group = 'Gold'
      else if (points >= 100) group = 'Silver'
      
      const existing = groups.get(group) || { customers: 0, totalSpent: 0, salesCount: 0 }
      existing.customers += 1
      
      for (const sale of customer.posSales) {
        existing.totalSpent += toNumber(sale.totalAmount)
        existing.salesCount += 1
      }
      
      groups.set(group, existing)
    }

    const items = Array.from(groups.entries()).map(([group, data]) => ({
      group,
      customers: data.customers,
      totalSpent: data.totalSpent,
      salesCount: data.salesCount,
      avgSpent: data.customers > 0 ? data.totalSpent / data.customers : 0
    }))

    const totals = items.reduce(
      (s, r) => ({
        customers: s.customers + r.customers,
        amount: s.amount + r.totalSpent
      }),
      { customers: 0, amount: 0 }
    )

    return NextResponse.json({ range: { from, to }, items, totals })
  } catch (e) {
    return NextResponse.json({
      range: { from, to },
      items: [],
      totals: { customers: 0, amount: 0 }
    })
  }
}
