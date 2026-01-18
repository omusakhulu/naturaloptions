import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, formatISO } from 'date-fns'

export const runtime = 'nodejs'

function toNumber(value: any): number {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const n = parseFloat(value)
    return Number.isFinite(n) ? n : 0
  }

  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      {
        rangeDays: 30,
        kpis: {
          revenue: 0,
          orders: 0,
          posRevenue: 0,
          posTransactions: 0,
          expenses: 0,
          netRevenue: 0
        },
        insights: [],
        lowStock: [],
        topCustomers: [],
        updatedAt: new Date().toISOString()
      },
      { status: 200 }
    )
  }

  try {
    const { searchParams } = new URL(req.url)
    const rangeDays = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30')))
    const lowStockThreshold = Math.max(0, parseInt(searchParams.get('lowStockThreshold') || '10'))

    const today = startOfDay(new Date())
    const from = subDays(today, rangeDays - 1)

    const [wooOrders, posAgg, expensesAgg, lowStock, topCustomers] = await Promise.all([
      prisma.order.findMany({
        where: { dateCreated: { gte: from } },
        select: { dateCreated: true, total: true }
      }),
      prisma.pOSSale.aggregate({
        where: { saleDate: { gte: from } },
        _sum: { totalAmount: true },
        _count: { id: true }
      }),
      prisma.expense.aggregate({
        where: { date: { gte: from } },
        _sum: { amount: true },
        _count: { id: true }
      }),
      prisma.product.findMany({
        where: { actualStock: { lte: lowStockThreshold } },
        select: { id: true, name: true, sku: true, actualStock: true, lowStockAlert: true },
        orderBy: { actualStock: 'asc' },
        take: 10
      }),
      prisma.pOSCustomer.findMany({
        orderBy: { totalSpent: 'desc' },
        take: 5,
        select: { id: true, firstName: true, lastName: true, totalSpent: true, loyaltyPoints: true }
      })
    ])

    const wooRevenue = wooOrders.reduce((sum, o) => sum + toNumber(o.total), 0)
    const wooCount = wooOrders.length
    const posRevenue = toNumber(posAgg._sum.totalAmount)
    const posTransactions = posAgg._count.id
    const expenses = toNumber(expensesAgg._sum.amount)

    const revenue = wooRevenue + posRevenue
    const netRevenue = revenue - expenses

    const byDay = new Map()
    for (const o of wooOrders) {
      const day = formatISO(startOfDay(o.dateCreated as Date), { representation: 'date' })
      byDay.set(day, (byDay.get(day) || 0) + toNumber(o.total))
    }

    const dailySales = Array.from(byDay.entries())
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      .map(([date, total]) => ({ date, total }))

    const last7Arr = dailySales.slice(-7)
    const prev7Arr = dailySales.slice(-14, -7)
    const last7 = last7Arr.reduce((s, d) => s + toNumber(d.total), 0)
    const prev7 = prev7Arr.reduce((s, d) => s + toNumber(d.total), 0)
    const growthPct = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : 0

    const insights: Array<{ title: string; severity: 'info' | 'warning' | 'success'; message: string }> = []

    if (dailySales.length >= 7) {
      if (growthPct >= 5) {
        insights.push({
          title: 'Revenue Trend',
          severity: 'success',
          message: `Sales are up ${growthPct.toFixed(1)}% week-over-week (Woo orders).`
        })
      } else if (growthPct <= -5) {
        insights.push({
          title: 'Revenue Trend',
          severity: 'warning',
          message: `Sales are down ${Math.abs(growthPct).toFixed(1)}% week-over-week (Woo orders).`
        })
      } else {
        insights.push({
          title: 'Revenue Trend',
          severity: 'info',
          message: `Sales are relatively flat week-over-week (Woo orders).`
        })
      }
    }

    if (lowStock.length > 0) {
      insights.push({
        title: 'Inventory',
        severity: 'warning',
        message: `Low stock alert: ${lowStock.length} items at or below ${lowStockThreshold} units.`
      })
    }

    if (expenses > 0 && revenue > 0) {
      const ratio = (expenses / revenue) * 100
      if (ratio >= 20) {
        insights.push({
          title: 'Expenses',
          severity: 'warning',
          message: `Expenses are ${ratio.toFixed(1)}% of revenue over the last ${rangeDays} days.`
        })
      }
    }

    if (netRevenue < 0) {
      insights.push({
        title: 'Profitability',
        severity: 'warning',
        message: `Net revenue is negative over the last ${rangeDays} days. Review expenses and margins.`
      })
    }

    if (topCustomers.length > 0) {
      const top = topCustomers[0]
      const topSpent = toNumber(top.totalSpent)
      if (topSpent > 0) {
        insights.push({
          title: 'Customers',
          severity: 'info',
          message: `Top customer has spent ${topSpent.toFixed(0)} (POS lifetime total). Consider a VIP offer.`
        })
      }
    }

    return Response.json(
      {
        rangeDays,
        kpis: {
          revenue,
          orders: wooCount,
          posRevenue,
          posTransactions,
          expenses,
          netRevenue
        },
        insights,
        lowStock,
        topCustomers,
        updatedAt: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('BI insights error', err)
    return Response.json({ error: 'Failed to fetch BI insights', details: err?.message }, { status: 500 })
  }
}
