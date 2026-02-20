import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, formatISO } from 'date-fns'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return Response.json({
      totalSales: 0,
      totalOrders: 0,
      dailySales: [],
      paymentMethods: [],
      totalExpenses: 0,
      totalTax: 0,
      totalReturns: 0,
      totalDiscounts: 0,
      totalCOGS: 0,
      netProfit: 0,
      grossProfitPercent: 0,
      paymentStatusBreakdown: { paid: 0, due: 0, partial: 0 }
    }, { status: 200 })
  }

  try {
    const today = startOfDay(new Date())
    const from = subDays(today, 29)

    // Fetch orders and aggregate in JS since 'total' is stored as string
    const orders = await prisma.order.findMany({
      where: { dateCreated: { gte: from } },
      select: {
        dateCreated: true,
        total: true,
        paymentMethodTitle: true,
        taxTotal: true,
        discountTotal: true,
        shippingTotal: true
      }
    })

    const byDay = new Map<string, number>()
    for (const o of orders) {
      const day = formatISO(startOfDay(o.dateCreated as Date), { representation: 'date' })
      const val = parseFloat((o.total as unknown as string) || '0') || 0
      byDay.set(day, (byDay.get(day) || 0) + val)
    }

    const dailySales = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({ date, total }))

    const totalSales = orders.reduce((sum, o) => sum + (parseFloat((o.total as unknown as string) || '0') || 0), 0)
    const totalOrders = orders.length

    // Tax from orders
    const totalTax = orders.reduce((sum, o) => sum + (parseFloat((o.taxTotal as unknown as string) || '0') || 0), 0)

    // Discounts from orders
    const totalDiscounts = orders.reduce((sum, o) => sum + (parseFloat((o.discountTotal as unknown as string) || '0') || 0), 0)

    // Payment method distribution
    const methodMap = new Map<string, number>()
    for (const o of orders) {
      const method = (o.paymentMethodTitle as string) || 'Unknown'
      const val = parseFloat((o.total as unknown as string) || '0') || 0
      methodMap.set(method, (methodMap.get(method) || 0) + val)
    }
    const paymentMethods = Array.from(methodMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([method, amount]) => ({ method, amount }))

    // Expenses, Returns, and Invoice status
    const [expAgg, sRetAgg, pRetAgg, invoiceStatuses] = await Promise.all([
      prisma.expense.aggregate({
        where: { date: { gte: from, lte: today } },
        _sum: { amount: true }
      }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.salesReturn.aggregate({
        where: { date: { gte: from, lte: today } },
        _sum: { amount: true }
      }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.purchaseReturn.aggregate({
        where: { date: { gte: from, lte: today } },
        _sum: { amount: true }
      }).catch(() => ({ _sum: { amount: 0 } })),
      prisma.invoice.groupBy({
        by: ['invoiceStatus'],
        where: { date: { gte: from, lte: today } },
        _count: true
      }).catch(() => [])
    ])

    const totalExpenses = Number(expAgg._sum.amount || 0)
    const salesReturns = Number(sRetAgg._sum.amount || 0)
    const purchaseReturns = Number(pRetAgg._sum.amount || 0)
    const totalReturns = salesReturns + purchaseReturns

    // COGS calculation (placeholder - can be enhanced with actual product costs)
    const totalCOGS = totalSales * 0.4 // 40% estimate

    // Net and Gross Profit
    const grossProfit = totalSales - totalCOGS
    const netProfit = grossProfit - totalExpenses - totalTax
    const grossProfitPercent = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0

    // Payment status breakdown
    const paymentStatusBreakdown = {
      paid: 0,
      due: 0,
      partial: 0
    }

    for (const status of invoiceStatuses) {
      if (status.invoiceStatus === 'paid') {
        paymentStatusBreakdown.paid = status._count
      } else if (status.invoiceStatus === 'partially_paid') {
        paymentStatusBreakdown.partial = status._count
      } else if (status.invoiceStatus === 'sent' || status.invoiceStatus === 'draft') {
        paymentStatusBreakdown.due += status._count
      }
    }

    return Response.json({
      totalSales,
      totalOrders,
      dailySales,
      paymentMethods,
      totalExpenses,
      totalTax,
      totalReturns,
      totalDiscounts,
      totalCOGS,
      netProfit,
      grossProfitPercent,
      paymentStatusBreakdown
    })
  } catch (err: any) {
    console.error('BI metrics error', err)
    return new Response('Error', { status: 500 })
  }
}
