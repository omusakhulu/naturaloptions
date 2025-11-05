// MUI Imports
import Link from 'next/link'

import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

import Masonry from '@mui/lab/Masonry'

import { getAnalytics } from '@/lib/woocommerce'

// Components Imports
import CongratulationsJohn from '@views/apps/ecommerce/dashboard/Congratulations'
import StatisticsCard from '@views/apps/ecommerce/dashboard/StatisticsCard'
import LineChartProfit from '@views/apps/ecommerce/dashboard/LineChartProfit'
import RadialBarChart from '@views/apps/ecommerce/dashboard/RadialBarChart'
import DonutChartGeneratedLeads from '@views/apps/ecommerce/dashboard/DonutChartGeneratedLeads'
import RevenueReport from '@views/apps/ecommerce/dashboard/RevenueReport'
import EarningReports from '@views/apps/ecommerce/dashboard/EarningReports'
import PopularProducts from '@views/apps/ecommerce/dashboard/PopularProducts'
import Orders from '@views/apps/ecommerce/dashboard/Orders'
import Transactions from '@views/apps/ecommerce/dashboard/Transactions'
import InvoiceListTable from '@views/apps/ecommerce/dashboard/InvoiceListTable'
import TaxesReport from '@views/apps/ecommerce/dashboard/TaxesReport'
import PeriodButtons from '@/components/dashboard/PeriodButtons'
import RefreshButton from '@/components/dashboard/RefreshButton'
import WarehouseOverview from '@views/apps/ecommerce/dashboard/WarehouseOverview'
import PackingSlipsSummary from '@views/apps/ecommerce/dashboard/PackingSlipsSummary'
import StockAlerts from '@views/apps/ecommerce/dashboard/StockAlerts'
import TentQuotesSummary from '@views/apps/ecommerce/dashboard/TentQuotesSummary'
import BOQSummary from '@views/apps/ecommerce/dashboard/BOQSummary'

// Data Imports
// import { getInvoiceData } from '@/app/server/actions'
import { getAllOrders } from '@/lib/db/orders'
import { getAllCustomers } from '@/lib/db/customers'
import { getAllProducts } from '@/lib/db/products'
import { getAllInvoices } from '@/lib/db/invoices'
import { getAllPackingSlips } from '@/lib/db/packingSlips'

// Add caching - revalidate every 60 seconds
export const revalidate = 60

/**
 * ! If you need data using an API call, uncomment the below API code, update the `process.env.API_URL` variable in the
 * ! `.env` file found at root of your project and also update the API endpoints like `/apps/invoice` in below example.
 * ! Also, remove the above server action import and the action itself from the `src/app/server/actions.ts` file to clean up unused code
 * ! because we've used the server action for getting our static data.
 */
/* const getInvoiceData = async () => {
  // Vars
  const res = await fetch(`${process.env.API_URL}/apps/invoice`)

  if (!res.ok) {
    throw new Error('Failed to fetch invoice data')
  }

  return res.json()
}
 */
const EcommerceDashboard = async ({ params, searchParams }) => {
  // Await params (Next.js 15 requirement)
  const resolvedParams = await params
  const lang = resolvedParams?.lang || 'en'

  // Await searchParams (Next.js 15 requirement)
  const resolvedSearchParams = await searchParams

  // Date filters from query (?period=week|month|year or ?after=YYYY-MM-DD&before=YYYY-MM-DD)
  const period = (resolvedSearchParams?.period || '').toLowerCase()
  const qpAfter = resolvedSearchParams?.after
  const qpBefore = resolvedSearchParams?.before
  const today = new Date()

  const startOfWeek = (() => {
    const d = new Date(today)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)

    d.setDate(diff)
    d.setHours(0, 0, 0, 0)

    return d
  })()

  // Build date range helpers
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const startOfYear = new Date(today.getFullYear(), 0, 1)
  const toISO = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

  const range = (() => {
    if (qpAfter && qpBefore) return { after: qpAfter, before: qpBefore }
    if (period === 'week') return { after: toISO(startOfWeek), before: toISO(today) }
    if (period === 'year') return { after: toISO(startOfYear), before: toISO(today) }

    return { after: toISO(startOfMonth), before: toISO(today) }
  })()

  // Fetch DB data with limits for faster loading with error handling
  let orders = []
  let customers = []
  let products = []
  let invoicesRaw = []
  let packingSlips = []

  try {
    [orders, customers, products, invoicesRaw, packingSlips] = await Promise.all([
      getAllOrders().catch(() => []),
      getAllCustomers().catch(() => []),
      getAllProducts().catch(() => []),
      getAllInvoices().catch(() => []),
      getAllPackingSlips().catch(() => [])
    ])
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  }

  // Fetch warehouse and inventory data - skip API calls during build
  const warehousesData = typeof window === 'undefined' 
    ? { warehouses: [] }
    : await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/warehouses`)
        .then(res => res.json())
        .catch(() => ({ warehouses: [] }))

  // Limit to first 3 warehouses for faster dashboard loading
  const warehouses = (warehousesData.warehouses || []).slice(0, 3)

  // Fetch inventory and movements in parallel for better performance
  let inventoryItems = []
  let stockMovements = []

  if (warehouses.length > 0) {
    try {
      const inventoryPromises = warehouses.map(warehouse =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/warehouses/${warehouse.id}/inventory`)
          .then(res => res.json())
          .catch(() => ({ items: [] }))
      )

      const movementPromises = warehouses.map(warehouse =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/warehouses/${warehouse.id}/movements`)
          .then(res => res.json())
          .catch(() => ({ movements: [] }))
      )

      const [inventoryResults, movementResults] = await Promise.all([
        Promise.all(inventoryPromises),
        Promise.all(movementPromises)
      ])

      inventoryItems = inventoryResults.flatMap(result => result.items || [])
      stockMovements = movementResults.flatMap(result => result.movements || [])
    } catch (error) {
      console.error('Error fetching warehouse data:', error)
    }
  }

  // Fetch event tent quotes - skip during SSR
  const tentQuotesData = typeof window === 'undefined'
    ? { quotes: [] }
    : await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/quotes/event-tent/list`
      )
        .then(res => res.json())
        .catch(() => ({ quotes: [] }))

  const tentQuotes = tentQuotesData.quotes || []

  // Fetch BOQs - skip during SSR
  const boqsData = typeof window === 'undefined'
    ? { boqs: [] }
    : await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/boq/list`)
        .then(res => res.json())
        .catch(() => ({ boqs: [] }))

  const boqs = boqsData.boqs || []

  const safeFormatDate = d => {
    try {
      if (!d) return ''
      const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d

      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''

      return date.toLocaleDateString()
    } catch {
      return ''
    }
  }

  const invoiceData = (Array.isArray(invoicesRaw) ? invoicesRaw : []).map(inv => {
    const addressObj = (() => {
      try {
        if (typeof inv.billingAddress === 'string') return JSON.parse(inv.billingAddress)

        return inv.billingAddress || {}
      } catch {
        return {}
      }
    })()

    const invoiceStatus = inv.status || inv.invoiceStatus || 'draft'
    const total = Number.parseFloat(inv.amount || 0)

    return {
      id: inv.id,
      issuedDate: safeFormatDate(inv.date),
      dueDate: safeFormatDate(inv.dueDate),
      total: Number.isFinite(total) ? total.toFixed(2) : '0.00',
      balance: '',
      status: invoiceStatus,
      invoiceStatus,
      orderStatus: inv.orderStatus || null,
      name: inv.customerName,
      email: inv.customerEmail,
      address: addressObj
    }
  })

  // Top stats
  const totalOrders = orders?.length || 0
  const totalCustomers = customers?.length || 0
  const totalProducts = products?.length || 0

  const totalRevenue = (orders || []).reduce(
    (sum, order) => sum + (parseFloat(String(order.total || 0).replace(/[^0-9.-]/g, '')) || 0),
    0
  )

  // Helpers
  const toDate = o => {
    try {
      const d = o?.createdAt || o?.date || o?.updatedAt || o?.created_at
      const dt = d ? new Date(d) : null

      return dt && !Number.isNaN(dt.getTime()) ? dt : null
    } catch {
      return null
    }
  }

  // Revenue (analytics)
  let barSeries = [],
    lineSeries = []

  try {
    const interval = period === 'year' ? 'month' : 'day'
    const rev = await getAnalytics('reports/revenue', { interval, after: range.after, before: range.before })
    const intervals = Array.isArray(rev?.intervals) ? rev.intervals : []
    const series = intervals.map(int => parseFloat(int.subtotals?.total || int.totals?.total || 0) || 0)

    barSeries = [{ name: 'Revenue', data: series }]
    lineSeries = [{ name: 'Trend', data: series }]
  } catch {
    const now = new Date(),
      curYear = now.getFullYear()

    const monthly = Array(12).fill(0)

    ;(orders || []).forEach(o => {
      const d = toDate(o)

      if (d && d.getFullYear() === curYear) {
        const amt = parseFloat(String(o.total || 0).replace(/[^0-9.-]/g, '')) || 0

        monthly[d.getMonth()] += amt
      }
    })
    barSeries = [{ name: 'Revenue', data: monthly }]
    lineSeries = [{ name: 'Trend', data: monthly }]
  }

  // Earnings weekly and trends
  const toISODate = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

  const getWeekRange = (offsetWeeks = 0) => {
    const now2 = new Date()
    const day = now2.getDay()
    const monday = new Date(now2)

    monday.setDate(now2.getDate() - day + (day === 0 ? -6 : 1) - offsetWeeks * 7)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)

    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    return { start: monday, end: sunday }
  }

  let weeklySeries = [{ data: Array(7).fill(0) }],
    summary = {
      netProfit: 0,
      totalIncome: 0,
      totalExpenses: 0,
      salesCount: 0,
      incomeTrend: 0,
      expenseTrend: 0,
      profitTrend: 0
    }

  try {
    const cur = getWeekRange(0),
      prev = getWeekRange(1)

    const curRes = await getAnalytics('reports/revenue', {
      interval: 'day',
      after: toISODate(cur.start),
      before: toISODate(cur.end)
    })

    const prevRes = await getAnalytics('reports/revenue', {
      interval: 'day',
      after: toISODate(prev.start),
      before: toISODate(prev.end)
    })

    const curDays = Array.isArray(curRes?.intervals) ? curRes.intervals : [],
      prevDays = Array.isArray(prevRes?.intervals) ? prevRes.intervals : []

    const toArr = arr => {
      const out = Array(7).fill(0)

      arr.forEach((it, idx) => {
        const amt = parseFloat(it.subtotals?.net_revenue || it.subtotals?.total || it.totals?.total || 0) || 0

        if (idx < 7) out[idx] = amt
      })

      return out
    }

    const curVals = toArr(curDays),
      prevVals = toArr(prevDays)

    const curIncome = curVals.reduce((a, v) => a + v, 0),
      prevIncome = prevVals.reduce((a, v) => a + v, 0)

    const curTaxes = (curRes?.totals?.taxes || 0) + (curRes?.totals?.shipping || 0)
    const prevTaxes = (prevRes?.totals?.taxes || 0) + (prevRes?.totals?.shipping || 0)

    const curProfit = Math.max(0, curIncome - curTaxes),
      prevProfit = Math.max(0, prevIncome - prevTaxes)

    weeklySeries = [{ data: curVals }]
    summary = {
      netProfit: curProfit,
      totalIncome: curIncome,
      totalExpenses: curTaxes,
      salesCount: Number(curRes?.totals?.orders_count || 0),
      incomeTrend: prevIncome ? ((curIncome - prevIncome) / prevIncome) * 100 : 0,
      expenseTrend: prevTaxes ? ((curTaxes - prevTaxes) / prevTaxes) * 100 : 0,
      profitTrend: prevProfit ? ((curProfit - prevProfit) / prevProfit) * 100 : 0
    }
  } catch {
    const weekDays = Array(7).fill(0)
    let totalIncome = 0

    ;(orders || []).forEach(o => {
      const d = toDate(o)
      const amt = parseFloat(String(o.total || 0).replace(/[^0-9.-]/g, '')) || 0

      totalIncome += amt

      if (d) {
        const idx = Math.floor((d - startOfWeek) / (1000 * 60 * 60 * 24))

        if (idx >= 0 && idx < 7) weekDays[idx] += amt
      }
    })
    weeklySeries = [{ data: weekDays }]
    summary = {
      netProfit: totalIncome * 0.2,
      totalIncome,
      totalExpenses: 0,
      salesCount: orders?.length || 0,
      incomeTrend: 0,
      expenseTrend: 0,
      profitTrend: 0
    }
  }

  // Recent orders (filtered by date range)
  const inRange = d => {
    try {
      const ts = new Date(d).getTime()

      return ts >= new Date(range.after).getTime() && ts <= new Date(range.before).getTime()
    } catch {
      return true
    }
  }

  // Create packing slip lookup by order ID
  const packingSlipLookup = new Map()

  ;(packingSlips || []).forEach(slip => {
    if (slip.wooOrderId) {
      packingSlipLookup.set(slip.wooOrderId, {
        boothNumber: slip.boothNumber,
        status: slip.status,
        packingSlipNumber: slip.packingSlipNumber
      })
    }
  })

  // Create invoice lookup by order ID
  const invoiceLookup = new Map()

  ;(Array.isArray(invoicesRaw) ? invoicesRaw : []).forEach(inv => {
    if (inv.wooOrderId) {
      invoiceLookup.set(inv.wooOrderId, {
        invoiceNumber: inv.invoiceNumber,
        status: inv.status
      })
    }
  })

  // Limit processing to recent 50 orders instead of all for performance
  const recentOrders = (orders || [])
    .slice()
    .sort((a, b) => (toDate(b)?.getTime() || 0) - (toDate(a)?.getTime() || 0))
    .slice(0, 50) // Process only 50 most recent
    .filter(o => {
      const d = toDate(o)

      return d ? inRange(d) : true
    })
    .slice(0, 5) // Show only 5
    .map(o => {
      const packingSlip = packingSlipLookup.get(o.wooId || o.id)
      const invoice = invoiceLookup.get(o.wooId || o.id)

      return {
        ...o,
        boothNumber: packingSlip?.boothNumber || null,
        packingSlipStatus: packingSlip?.status || null,
        packingSlipNumber: packingSlip?.packingSlipNumber || null,
        invoiceNumber: invoice?.invoiceNumber || null,
        invoiceStatus: invoice?.status || null
      }
    })

  // Popular products - limit to 6 for dashboard
  const productSales = new Map()

  try {
    const prods = await getAnalytics('reports/products', { orderby: 'items_sold', order: 'desc', per_page: 6 })
    const rows = Array.isArray(prods) ? prods : prods?.data || []

    rows.forEach(r => {
      const key = r.product_id || r.product || r.extended_info?.name

      if (!key) return
      productSales.set(String(key), {
        title: r.extended_info?.name || r.name || `#${key}`,
        sold: Number(r.items_sold || r.qty || 0),
        amount: Number(r.net_revenue || r.total_sales || 0),
        imgSrc: r.extended_info?.image || null
      })
    })
  } catch {
    ;(orders || []).forEach(o => {
      const items = Array.isArray(o.lineItems)
        ? o.lineItems
        : (() => {
            try {
              return JSON.parse(o.lineItems || '[]')
            } catch {
              return []
            }
          })()

      items.forEach(it => {
        const key = it.product_id || it.wooId || it.name

        const cur = productSales.get(key) || {
          title: it.name || `#${key}`,
          sold: 0,
          amount: 0,
          imgSrc: it.image || null
        }

        const qty = parseFloat(it.quantity || 0) || 0
        const tot = parseFloat(it.total || it.subtotal || 0) || 0

        cur.sold += qty
        cur.amount += tot
        productSales.set(key, cur)
      })
    })
  }

  const productImageLookup = new Map()

  ;(products || []).forEach(p => {
    try {
      const img = p.image || (Array.isArray(p.images) ? p.images[0]?.src || p.images[0] : null)

      if (p.wooId) productImageLookup.set(String(p.wooId), img)
      if (p.id) productImageLookup.set(String(p.id), img)
      if (p.name) productImageLookup.set(p.name, img)
    } catch {}
  })

  const popularProducts = Array.from(productSales.entries())
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 6)
    .map(it => ({
      ...it,
      imgSrc: it.imgSrc || productImageLookup.get(String(it.key)) || productImageLookup.get(it.title) || null
    }))

  // Taxes
  let taxesMonthlySeries = [{ name: 'Tax', data: Array(12).fill(0) }],
    taxesMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    topRates = []

  try {
    const tax = await getAnalytics('reports/taxes', {
      interval: period === 'year' ? 'month' : 'day',
      after: range.after,
      before: range.before
    })

    const ints = Array.isArray(tax?.intervals) ? tax.intervals : []
    const values = ints.map(int => parseFloat(int.subtotals?.tax_total || int.totals?.total_tax || 0) || 0)

    taxesMonthlySeries = [{ name: 'Tax', data: values }]
    const rates = Array.isArray(tax?.totals) ? tax.totals : []

    topRates = rates
      .map(r => ({ label: r.rate || r.name || r.rate_id || 'Rate', amount: Number(r.total_tax || r.tax_total || 0) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  } catch {}

  // Invoices summary
  const invoiceSummary = (() => {
    try {
      const list = Array.isArray(invoiceData) ? invoiceData : []

      const byStatus = list.reduce((acc, inv) => {
        const s = inv.status || inv.invoiceStatus || 'unknown'

        acc[s] = (acc[s] || 0) + 1

        return acc
      }, {})

      return { count: list.length, byStatus }
    } catch {
      return { count: 0, byStatus: {} }
    }
  })()

  // Calculate real data for small cards
  // Profit data - last 6 months
  const profitMonthlyData = (() => {
    const last6Months = Array(6).fill(0)
    const now = new Date()
    
    ;(orders || []).forEach(o => {
      const d = toDate(o)
      if (d) {
        const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
        if (monthsAgo >= 0 && monthsAgo < 6) {
          const revenue = parseFloat(String(o.total || 0).replace(/[^0-9.-]/g, '')) || 0
          last6Months[5 - monthsAgo] += revenue * 0.2 // 20% profit margin estimate
        }
      }
    })
    return last6Months
  })()

  const totalMonthlyProfit = profitMonthlyData.reduce((a, b) => a + b, 0)
  const prevMonthProfit = profitMonthlyData.slice(0, 5).reduce((a, b) => a + b, 0) / 5
  const currentMonthProfit = profitMonthlyData[5]
  const profitGrowth = prevMonthProfit > 0 
    ? `${((currentMonthProfit - prevMonthProfit) / prevMonthProfit * 100) > 0 ? '+' : ''}${((currentMonthProfit - prevMonthProfit) / prevMonthProfit * 100).toFixed(1)}%`
    : '+0.0%'

  // Expenses data
  const totalExpenses = summary.totalExpenses
  const expensePercent = summary.totalIncome > 0 
    ? Math.round((totalExpenses / summary.totalIncome) * 100)
    : 0
  const expenseDiff = summary.expenseTrend !== 0
    ? `${summary.expenseTrend > 0 ? '+' : ''}${summary.expenseTrend.toFixed(1)}% vs last week`
    : 'No change from last week'

  // Orders by status distribution for donut chart
  const ordersByStatus = (() => {
    const statusCounts = {
      completed: 0,
      processing: 0,
      pending: 0,
      'on-hold': 0
    }
    
    ;(orders || []).forEach(o => {
      const status = (o.status || 'pending').toLowerCase()
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status]++
      }
    })
    
    return Object.values(statusCounts)
  })()

  const orderGrowthData = (() => {
    const thisMonth = new Date().getMonth()
    const thisYear = new Date().getFullYear()
    let thisMonthOrders = 0
    let lastMonthOrders = 0
    
    ;(orders || []).forEach(o => {
      const d = toDate(o)
      if (d && d.getFullYear() === thisYear) {
        if (d.getMonth() === thisMonth) thisMonthOrders++
        if (d.getMonth() === thisMonth - 1) lastMonthOrders++
      }
    })
    
    return { thisMonth: thisMonthOrders, lastMonth: lastMonthOrders }
  })()

  const orderGrowth = orderGrowthData.lastMonth > 0
    ? `${orderGrowthData.thisMonth > orderGrowthData.lastMonth ? '+' : ''}${(((orderGrowthData.thisMonth - orderGrowthData.lastMonth) / orderGrowthData.lastMonth) * 100).toFixed(1)}%`
    : '+0.0%'

  // Top sales person data (from orders)
  const topSalesPerson = (() => {
    const salesByUser = new Map()
    
    ;(orders || []).forEach(o => {
      const user = o.createdBy || 'System'
      const amount = parseFloat(String(o.total || 0).replace(/[^0-9.-]/g, '')) || 0
      salesByUser.set(user, (salesByUser.get(user) || 0) + amount)
    })
    
    let topUser = 'Admin'
    let topAmount = 0
    
    salesByUser.forEach((amount, user) => {
      if (amount > topAmount) {
        topAmount = amount
        topUser = user
      }
    })
    
    return {
      name: topUser === 'System' ? 'Admin' : topUser,
      amount: `$${(topAmount / 1000).toFixed(1)}k`,
      role: topAmount > 0 ? 'Top performer this month' : 'Getting started'
    }
  })()

  return (
    <Grid container spacing={6}>
      {/* Shortcuts */}
      <Grid size={12}>
        <div className='flex flex-wrap gap-2'>
          <Button component={Link} href={`/${lang}/apps/ecommerce/orders/list`} variant='outlined' size='small'>
            Orders
          </Button>
          <Button component={Link} href={`/${lang}/apps/ecommerce/products/list`} variant='outlined' size='small'>
            Products
          </Button>
          <Button component={Link} href={`/${lang}/apps/invoice/list`} variant='outlined' size='small'>
            Invoices
          </Button>
          <Button component={Link} href={`/${lang}/apps/ecommerce/customers/list`} variant='outlined' size='small'>
            Customers
          </Button>
          <Button component={Link} href={`/${lang}/apps/warehouses/list`} variant='outlined' size='small'>
            Warehouses
          </Button>
          <Button component={Link} href={`/${lang}/apps/packing-slips/list`} variant='outlined' size='small'>
            Packing Slips
          </Button>
          <Button component={Link} href={`/${lang}/apps/tent-quotes/create`} variant='outlined' size='small'>
            Event Tent Quotes
          </Button>
          <Button component={Link} href={`/${lang}/apps/boq/list`} variant='outlined' size='small'>
            BOQ (Bill of Quantities)
          </Button>
          <Button component={Link} href={`/${lang}/apps/invoice/generate`} variant='outlined' size='small'>
            Generate Invoices
          </Button>
        </div>
      </Grid>

      {/* Sticky period toolbar */}
      <Grid size={12}>
        <div className='sticky top-[64px] z-10 bg-background/80 backdrop-blur rounded px-2 py-2 flex justify-between items-center'>
          <RefreshButton size='small' />
          <PeriodButtons />
        </div>
      </Grid>

      {/* Statistics */}
      <Grid size={12}>
        <StatisticsCard
          totals={{ orders: totalOrders, customers: totalCustomers, products: totalProducts, revenue: totalRevenue }}
          lang={lang}
        />
      </Grid>

      {/* Small charts */}
      <Grid size={6}>
        <Grid container spacing={6}>
          <Grid size={6}>
            <LineChartProfit 
              profitData={profitMonthlyData}
              totalProfit={`$${(totalMonthlyProfit / 1000).toFixed(1)}k`}
              growthPercent={profitGrowth}
            />
          </Grid>
          <Grid size={6}>
            <RadialBarChart 
              totalExpenses={`$${(totalExpenses / 1000).toFixed(1)}k`}
              expensePercent={expensePercent}
              expenseDiff={expenseDiff}
            />
          </Grid>
          <Grid size={12}>
            <DonutChartGeneratedLeads 
              categorySales={ordersByStatus}
              totalLeads={totalOrders.toLocaleString()}
              growthPercent={orderGrowth}
              categories={['Completed', 'Processing', 'Pending', 'On Hold']}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Revenue */}
      <Grid size={6}>
        <RevenueReport
          barSeries={barSeries}
          lineSeries={lineSeries}
          totalLabel={`$${totalRevenue.toLocaleString()}`}
          budgetLabel={'—'}
        />
      </Grid>

      {/* === FINANCIAL PERFORMANCE === */}
      <Grid size={12}>
        <Typography variant='h5' className='font-semibold mbs-6 mbe-4'>
          Financial Performance
        </Typography>
      </Grid>
      <Grid size={12}>
        <Masonry columns={{ sm: 2, lg: 3 }} spacing={2}>
          <div>
            <EarningReports weeklySeries={weeklySeries} summary={summary} />
          </div>
          <div>
            <TaxesReport monthlySeries={taxesMonthlySeries} months={taxesMonths} topRates={topRates} />
          </div>
          <div>
            <Transactions
              transactions={(() => {
                const tx = []

                ;(recentOrders || []).forEach(o => {
                  const total = parseFloat(String(o.total || 0).replace(/[^0-9.-]/g, '')) || 0

                  if (total)
                    tx.push({
                      title: `Order #${o.id}`,
                      subtitle: o.status || 'payment',
                      amount: total,
                      avatarColor: 'success',
                      avatarIcon: 'tabler-brand-paypal'
                    })
                  const refund = parseFloat(String(o.refund_total || 0).replace(/[^0-9.-]/g, '')) || 0

                  if (refund)
                    tx.push({
                      title: `Refund #${o.id}`,
                      subtitle: 'refund',
                      amount: -Math.abs(refund),
                      avatarColor: 'info',
                      avatarIcon: 'tabler-currency-dollar'
                    })
                })

                return tx.slice(0, 7)
              })()}
            />
          </div>
        </Masonry>
      </Grid>

      {/* === ORDER MANAGEMENT & FULFILLMENT === */}
      <Grid size={12}>
        <Typography variant='h5' className='font-semibold mbs-6 mbe-4'>
          Order Management & Fulfillment
        </Typography>
      </Grid>
      <Grid size={{ sm: 12, md: 6 }}>
        <Orders recentOrders={recentOrders} lang={lang} />
      </Grid>
      <Grid size={{ sm: 12, md: 6 }}>
        <PackingSlipsSummary packingSlips={packingSlips} lang={lang} />
      </Grid>

      {/* === QUOTES & PROPOSALS === */}
      <Grid size={12}>
        <Typography variant='h5' className='font-semibold mbs-6 mbe-4'>
          Quotes & Proposals
        </Typography>
      </Grid>
      <Grid size={{ sm: 12, md: 6 }}>
        <TentQuotesSummary quotes={tentQuotes} lang={lang} />
      </Grid>
      <Grid size={{ sm: 12, md: 6 }}>
        <BOQSummary boqs={boqs} lang={lang} />
      </Grid>

      {/* === INVENTORY & WAREHOUSE MANAGEMENT === */}
      <Grid size={12}>
        <Typography variant='h5' className='font-semibold mbs-6 mbe-4'>
          Inventory & Warehouse Management
        </Typography>
      </Grid>
      <Grid size={12}>
        <Masonry columns={{ sm: 1, lg: 3 }} spacing={2}>
          <div>
            <PopularProducts products={popularProducts} />
          </div>
          <div>
            <WarehouseOverview
              warehouses={warehouses}
              inventoryItems={inventoryItems}
              stockMovements={stockMovements}
            />
          </div>
          <div>
            <StockAlerts inventoryItems={inventoryItems} lang={lang} />
          </div>
        </Masonry>
      </Grid>

      {/* === INVOICES === */}
      <Grid size={12}>
        <Typography variant='h5' className='font-semibold mbs-6 mbe-4'>
          Invoices
        </Typography>
      </Grid>
      <Grid size={12}>
        <InvoiceListTable invoiceData={invoiceData} />
        <div className='mt-4 flex gap-4 flex-wrap items-center'>
          <span className='text-sm'>Invoices: {invoiceSummary.count}</span>
          {Object.entries(invoiceSummary.byStatus).map(([k, v]) => (
            <Link key={k} href={`/${lang}/apps/invoice/list?status=${encodeURIComponent(k)}`}>
              <Chip label={`${k} • ${v}`} variant='outlined' clickable size='small' />
            </Link>
          ))}
        </div>
      </Grid>
    </Grid>
  )
}

export default EcommerceDashboard
