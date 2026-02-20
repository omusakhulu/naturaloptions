// Force dynamic rendering - uses Prisma queries
export const dynamic = 'force-dynamic'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import DistributedBarChartOrder from '@views/dashboards/crm/DistributedBarChartOrder'
import LineAreaYearlySalesChart from '@views/dashboards/crm/LineAreaYearlySalesChart'
import CardStatVertical from '@/components/card-statistics/Vertical'
import BarChartRevenueGrowth from '@views/dashboards/crm/BarChartRevenueGrowth'
import EarningReportsWithTabs from '@views/dashboards/crm/EarningReportsWithTabs'
import RadarSalesChart from '@views/dashboards/crm/RadarSalesChart'
import SalesByCountries from '@views/dashboards/crm/SalesByCountries'
import ProjectStatus from '@views/dashboards/crm/ProjectStatus'
import ActiveProjects from '@views/dashboards/crm/ActiveProjects'
import LastTransaction from '@views/dashboards/crm/LastTransaction'
import ActivityTimeline from '@views/dashboards/crm/ActivityTimeline'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

// Database Imports
import prisma from '@/lib/prisma'

const DashboardCRM = async () => {
  // Vars
  const serverMode = await getServerMode()

  // Helper to parse money values from orders
  const toNum = v => parseFloat(String(v ?? 0).replace(/[^0-9.-]/g, '')) || 0

  // Helper to parse dates
  const toDate = o => {
    try {
      const d = o?.createdAt || o?.date || o?.updatedAt || o?.created_at
      const dt = d ? new Date(d) : null

      return dt && !Number.isNaN(dt.getTime()) ? dt : null
    } catch {
      return null
    }
  }

  // Fetch real data from database
  let orders = []
  let payments = []
  let projects = []
  let invoices = []

  try {
    const thirtyDaysAgo = new Date()

    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const sevenMonthsAgo = new Date()

    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7)

    ;[orders, payments, projects, invoices] = await Promise.all([
      prisma.order
        .findMany({
          where: { createdAt: { gte: thirtyDaysAgo } },
          take: 500,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            wooId: true,
            total: true,
            status: true,
            createdAt: true,
            billingAddress: true,
            refund_total: true
          }
        })
        .catch(() => []),
      prisma.payment
        .findMany({
          take: 5,
          orderBy: { paymentDate: 'desc' },
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            status: true,
            paymentDate: true,
            cardType: true,
            cardLast4: true,
            checkNumber: true
          }
        })
        .catch(() => []),
      prisma.project
        .findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        })
        .catch(() => []),
      prisma.invoice
        .findMany({
          take: 5,
          orderBy: { date: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            date: true,
            amount: true,
            customerName: true
          }
        })
        .catch(() => [])
    ])
  } catch (error) {
    console.error('Error fetching CRM dashboard data:', error)
  }

  // === CALCULATE STATS ===

  // Total profit (estimate 20% margin) and total sales
  const totalSales = (orders || []).reduce((sum, order) => sum + toNum(order.total), 0)
  const totalProfit = totalSales * 0.2

  // Daily order counts for last 7 days (for DistributedBarChartOrder)
  const last7Days = Array(7)
    .fill(0)
    .map((_, i) => {
      const d = new Date()

      d.setDate(d.getDate() - (6 - i))
      d.setHours(0, 0, 0, 0)

      return d
    })

  const dailyOrderCounts = last7Days.map(targetDate => {
    return (orders || []).filter(o => {
      const orderDate = toDate(o)

      if (!orderDate) return false

      const od = new Date(orderDate)

      od.setHours(0, 0, 0, 0)

      return od.getTime() === targetDate.getTime()
    }).length
  })

  const totalOrders = (orders || []).length

  // Quarterly sales for last 4 quarters (for LineAreaYearlySalesChart)
  const now = new Date()
  const currentQuarter = Math.floor(now.getMonth() / 3)
  const currentYear = now.getFullYear()

  const quarters = Array(4)
    .fill(0)
    .map((_, i) => {
      let q = currentQuarter - (3 - i)
      let year = currentYear

      while (q < 0) {
        q += 4
        year -= 1
      }

      return { quarter: q, year }
    })

  const quarterlySales = quarters.map(({ quarter, year }) => {
    const startMonth = quarter * 3
    const endMonth = startMonth + 2

    return (orders || []).reduce((sum, order) => {
      const orderDate = toDate(order)

      if (!orderDate) return sum

      const oy = orderDate.getFullYear()
      const om = orderDate.getMonth()

      if (oy === year && om >= startMonth && om <= endMonth) {
        return sum + toNum(order.total)
      }

      return sum
    }, 0)
  })

  // Daily revenue for last 7 days (for BarChartRevenueGrowth)
  const dailyRevenue = last7Days.map(targetDate => {
    return (orders || []).reduce((sum, order) => {
      const orderDate = toDate(order)

      if (!orderDate) return sum

      const od = new Date(orderDate)

      od.setHours(0, 0, 0, 0)

      if (od.getTime() === targetDate.getTime()) {
        return sum + toNum(order.total)
      }

      return sum
    }, 0)
  })

  const totalWeekRevenue = dailyRevenue.reduce((a, b) => a + b, 0)

  // Monthly metrics YTD for EarningReportsWithTabs (orders, sales, profit, income)
  const ytdMonths = Array(9)
    .fill(0)
    .map((_, i) => i) // Jan=0 to Sep=8 for 9 months

  const monthlyOrders = ytdMonths.map(month => {
    return (orders || []).filter(o => {
      const orderDate = toDate(o)

      return orderDate && orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === month
    }).length
  })

  const monthlySales = ytdMonths.map(month => {
    return (orders || []).reduce((sum, order) => {
      const orderDate = toDate(order)

      if (orderDate && orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === month) {
        return sum + toNum(order.total)
      }

      return sum
    }, 0)
  })

  const monthlyProfit = monthlySales.map(sales => sales * 0.2)
  const monthlyIncome = monthlySales // Same as sales

  // Sales by customer location (from billingAddress city) - for SalesByCountries
  const locationSales = {}

  ;(orders || []).forEach(order => {
    try {
      const billingAddress =
        typeof order.billingAddress === 'string' ? JSON.parse(order.billingAddress) : order.billingAddress || {}

      const city = billingAddress.city || 'Unknown'
      const amount = toNum(order.total)

      locationSales[city] = (locationSales[city] || 0) + amount
    } catch {
      // Skip orders with invalid billing address
    }
  })

  const locationData = Object.entries(locationSales)
    .map(([city, total]) => ({ city, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
    .map(loc => ({
      title: `KSh ${(loc.total / 1000).toFixed(2)}k`,
      subtitle: loc.city,
      amount: loc.total
    }))

  // Sales and orders by month for RadarSalesChart (last 6 months)
  const last6Months = Array(6)
    .fill(0)
    .map((_, i) => {
      const d = new Date()

      d.setMonth(d.getMonth() - (5 - i))

      return d.getMonth()
    })

  const monthlySalesLast6 = last6Months.map(month => {
    return (orders || []).reduce((sum, order) => {
      const orderDate = toDate(order)

      if (orderDate && orderDate.getMonth() === month) {
        return sum + toNum(order.total) / 1000 // Convert to thousands
      }

      return sum
    }, 0)
  })

  const monthlyOrdersLast6 = last6Months.map(month => {
    return (orders || []).filter(o => {
      const orderDate = toDate(o)

      return orderDate && orderDate.getMonth() === month
    }).length
  })

  // Recent activity from orders and invoices
  const recentActivity = []

  // Add recent orders
  ;(orders || [])
    .slice(0, 3)
    .forEach(order => {
      recentActivity.push({
        type: 'order',
        title: `Order #${order.wooId || order.id} created`,
        amount: toNum(order.total),
        status: order.status || 'pending',
        date: toDate(order)
      })
    })

  // Add recent invoices
  ;(invoices || [])
    .slice(0, 2)
    .forEach(invoice => {
      recentActivity.push({
        type: 'invoice',
        title: `Invoice ${invoice.invoiceNumber || invoice.id} ${invoice.status || 'created'}`,
        amount: toNum(invoice.amount),
        customerName: invoice.customerName || 'Customer',
        date: toDate(invoice)
      })
    })

  // Sort by date descending
  recentActivity.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))

  // Format stats for display
  const formatCurrency = amount => {
    if (amount >= 1000) {
      return `KSh ${(amount / 1000).toFixed(1)}k`
    }

    return `KSh ${Math.round(amount)}`
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <DistributedBarChartOrder series={[{ data: dailyOrderCounts }]} totalOrders={totalOrders} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <LineAreaYearlySalesChart
          series={[{ data: quarterlySales }]}
          totalSales={formatCurrency(totalSales)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <CardStatVertical
          title='Total Profit'
          subtitle='Last 30 Days'
          stats={formatCurrency(totalProfit)}
          avatarColor='error'
          avatarIcon='tabler-credit-card'
          avatarSkin='light'
          avatarSize={44}
          chipText={totalProfit > 0 ? '+20.0%' : '0%'}
          chipColor={totalProfit > 0 ? 'success' : 'secondary'}
          chipVariant='tonal'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <CardStatVertical
          title='Total Sales'
          subtitle='Last 30 Days'
          stats={formatCurrency(totalSales)}
          avatarColor='success'
          avatarIcon='tabler-currency-dollar'
          avatarSkin='light'
          avatarSize={44}
          chipText={totalSales > 0 ? '+24.7%' : '0%'}
          chipColor={totalSales > 0 ? 'success' : 'secondary'}
          chipVariant='tonal'
        />
      </Grid>
      <Grid size={{ xs: 12, md: 8, lg: 4 }}>
        <BarChartRevenueGrowth
          series={[{ data: dailyRevenue }]}
          totalRevenue={formatCurrency(totalWeekRevenue)}
        />
      </Grid>
      <Grid size={{ xs: 12, lg: 8 }}>
        <EarningReportsWithTabs
          tabData={[
            {
              type: 'orders',
              avatarIcon: 'tabler-shopping-cart',
              series: [{ data: monthlyOrders }]
            },
            {
              type: 'sales',
              avatarIcon: 'tabler-chart-bar',
              series: [{ data: monthlySales.map(s => s / 1000) }] // Convert to thousands
            },
            {
              type: 'profit',
              avatarIcon: 'tabler-currency-dollar',
              series: [{ data: monthlyProfit.map(p => p / 1000) }] // Convert to thousands
            },
            {
              type: 'income',
              avatarIcon: 'tabler-chart-pie-2',
              series: [{ data: monthlyIncome.map(i => i / 1000) }] // Convert to thousands
            }
          ]}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <RadarSalesChart
          series={[
            { name: 'Sales', data: monthlySalesLast6 },
            { name: 'Orders', data: monthlyOrdersLast6 }
          ]}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <SalesByCountries data={locationData} />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <ProjectStatus
          projects={projects || []}
          totalRevenue={formatCurrency(totalSales)}
          totalProfit={formatCurrency(totalProfit)}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
        <ActiveProjects projects={projects || []} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <LastTransaction transactions={payments || []} serverMode={serverMode} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ActivityTimeline activities={recentActivity} />
      </Grid>
    </Grid>
  )
}

export default DashboardCRM
