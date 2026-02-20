import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/config/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    // Run all queries in parallel
    const [
      // Monthly POS sales
      monthlyPosSales,
      lastMonthPosSales,
      // Weekly POS sales (for daily breakdown)
      weeklyPosSales,
      // Order counts
      totalOrders,
      monthlyOrders,
      // Product counts
      totalProducts,
      // Customer counts
      totalCustomers,
      monthlyNewCustomers,
      // POS sales by day of week (last 30 days)
      recentPosSales,
      // Top locations/warehouses
      warehouseSales,
      // Total revenue from journal entries
      revenueEntries,
      expenseEntries
    ] = await Promise.all([
      // Monthly POS sales total
      prisma.pOSSale.aggregate({
        where: { saleDate: { gte: startOfMonth }, status: 'COMPLETED' },
        _sum: { totalAmount: true },
        _count: true
      }),
      // Last month POS sales
      prisma.pOSSale.aggregate({
        where: { saleDate: { gte: startOfLastMonth, lte: endOfLastMonth }, status: 'COMPLETED' },
        _sum: { totalAmount: true },
        _count: true
      }),
      // This week POS sales
      prisma.pOSSale.aggregate({
        where: { saleDate: { gte: startOfWeek }, status: 'COMPLETED' },
        _sum: { totalAmount: true },
        _count: true
      }),
      // Total orders synced
      prisma.order.count(),
      // Monthly orders
      prisma.order.count({ where: { dateCreated: { gte: startOfMonth } } }),
      // Total products
      prisma.product.count(),
      // Total customers (POS + WooCommerce)
      prisma.customer.count(),
      // New customers this month
      prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } }),
      // Recent POS sales for daily chart (last 30 days)
      prisma.pOSSale.findMany({
        where: {
          saleDate: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
          status: 'COMPLETED'
        },
        select: { saleDate: true, totalAmount: true },
        orderBy: { saleDate: 'asc' }
      }),
      // Stock quantity by inventory location
      prisma.inventoryLocation.groupBy({
        by: ['locationId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 6
      }),
      // Revenue journal entries this month
      prisma.journalLineItem.aggregate({
        where: {
          journal: { entryDate: { gte: startOfMonth }, status: 'POSTED' },
          account: { accountType: 'REVENUE' }
        },
        _sum: { creditAmount: true }
      }),
      // Expense journal entries this month
      prisma.journalLineItem.aggregate({
        where: {
          journal: { entryDate: { gte: startOfMonth }, status: 'POSTED' },
          account: { accountType: 'EXPENSE' }
        },
        _sum: { debitAmount: true }
      })
    ])

    // Calculate daily sales for chart (last 7 days)
    const dailySalesMap = new Map<string, number>()
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      dailySalesMap.set(key, 0)
    }
    for (const sale of recentPosSales) {
      const key = new Date(sale.saleDate).toISOString().slice(0, 10)
      if (dailySalesMap.has(key)) {
        dailySalesMap.set(key, (dailySalesMap.get(key) ?? 0) + parseFloat(sale.totalAmount.toString()))
      }
    }
    const dailySalesData = Array.from(dailySalesMap.entries()).map(([date, amount]) => ({
      date,
      day: dayNames[new Date(date).getDay()],
      amount: Math.round(amount)
    }))

    // Calculate weekly sales chart data (last 4 weeks)
    const weeklySales: number[] = []
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - w * 7 - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const weekTotal = recentPosSales
        .filter(s => {
          const d = new Date(s.saleDate)
          return d >= weekStart && d < weekEnd
        })
        .reduce((sum, s) => sum + parseFloat(s.totalAmount.toString()), 0)

      weeklySales.push(Math.round(weekTotal))
    }

    // Get location names for sales by location
    const locationIds = warehouseSales.map(w => w.locationId)
    const locations =
      locationIds.length > 0
        ? await prisma.location.findMany({
            where: { id: { in: locationIds } },
            select: { id: true, name: true }
          })
        : []
    const locationMap = new Map(locations.map(l => [l.id, l.name]))

    const salesByLocation = warehouseSales.map(w => ({
      location: locationMap.get(w.locationId) ?? 'Unknown',
      quantity: w._sum.quantity ?? 0
    }))

    // Monthly totals
    const monthTotal = parseFloat(monthlyPosSales._sum.totalAmount?.toString() ?? '0')
    const lastMonthTotal = parseFloat(lastMonthPosSales._sum.totalAmount?.toString() ?? '0')
    const monthGrowth =
      lastMonthTotal > 0 ? ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0

    const weekTotal = parseFloat(weeklyPosSales._sum.totalAmount?.toString() ?? '0')
    const revenue = parseFloat(revenueEntries._sum.creditAmount?.toString() ?? '0')
    const expenses = parseFloat(expenseEntries._sum.debitAmount?.toString() ?? '0')

    return NextResponse.json({
      monthlySales: {
        total: Math.round(monthTotal),
        count: monthlyPosSales._count,
        growth: parseFloat(monthGrowth.toFixed(1))
      },
      weeklySales: {
        total: Math.round(weekTotal),
        count: weeklyPosSales._count
      },
      dailySales: dailySalesData,
      weeklySalesChart: weeklySales,
      orders: {
        total: totalOrders,
        monthly: monthlyOrders
      },
      products: {
        total: totalProducts
      },
      customers: {
        total: totalCustomers,
        newThisMonth: monthlyNewCustomers
      },
      financials: {
        revenue: Math.round(revenue),
        expenses: Math.round(expenses),
        profit: Math.round(revenue - expenses)
      },
      salesByLocation
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats', details: message }, { status: 500 })
  }
}
