import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/config/auth'
import { prisma } from '@/lib/prisma'

interface ProductSales {
  productId: string
  name: string
  image: string | null
  unitsSold: number
  revenue: number
  growth?: number
  stock?: number
  price?: string
}

/**
 * GET /api/sales-targets/products
 * Fetch product performance analytics for a given month/year
 * Returns: topSellers, trending, pushThese, declining
 * Query params: month, year (defaults to current month/year)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: true,
        topSellers: [],
        trending: [],
        pushThese: [],
        declining: [],
        topCustomers: [],
        message: 'Database not configured'
      })
    }

    const { searchParams } = new URL(request.url)
    const now = new Date()
    const monthParam = searchParams.get('month')
    const yearParam = searchParams.get('year')

    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear()

    // Validate month and year
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ success: false, error: 'Invalid month' }, { status: 400 })
    }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ success: false, error: 'Invalid year' }, { status: 400 })
    }

    // Calculate date ranges
    const currentStartOfMonth = new Date(year, month - 1, 1)
    const currentEndOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

    // Previous month
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const prevStartOfMonth = new Date(prevYear, prevMonth - 1, 1)
    const prevEndOfMonth = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999)

    // Fetch current month POS sales grouped by product
    const currentPOSSales = await prisma.pOSSaleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          saleDate: {
            gte: currentStartOfMonth,
            lte: currentEndOfMonth
          },
          status: 'COMPLETED'
        }
      },
      _sum: {
        total: true,
        quantity: true
      },
      _count: true
    })

    // Fetch previous month POS sales grouped by product
    const prevPOSSales = await prisma.pOSSaleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          saleDate: {
            gte: prevStartOfMonth,
            lte: prevEndOfMonth
          },
          status: 'COMPLETED'
        }
      },
      _sum: {
        total: true,
        quantity: true
      },
      _count: true
    })

    // Fetch current month orders
    const currentOrders = await prisma.order.findMany({
      where: {
        dateCreated: {
          gte: currentStartOfMonth,
          lte: currentEndOfMonth
        }
      },
      select: {
        lineItems: true
      }
    })

    // Fetch previous month orders
    const prevOrders = await prisma.order.findMany({
      where: {
        dateCreated: {
          gte: prevStartOfMonth,
          lte: prevEndOfMonth
        }
      },
      select: {
        lineItems: true
      }
    })

    // Aggregate order line items by product for current month
    const currentOrderSales = new Map<string, { quantity: number; revenue: number }>()
    currentOrders.forEach(order => {
      try {
        const lineItems = typeof order.lineItems === 'string'
          ? JSON.parse(order.lineItems)
          : order.lineItems || []

        if (Array.isArray(lineItems)) {
          lineItems.forEach((item: any) => {
            const productId = String(item.product_id || item.id || '')
            if (productId) {
              const quantity = parseInt(item.quantity || '0', 10)
              const total = parseFloat(item.total || '0')

              const current = currentOrderSales.get(productId) || { quantity: 0, revenue: 0 }
              currentOrderSales.set(productId, {
                quantity: current.quantity + (isNaN(quantity) ? 0 : quantity),
                revenue: current.revenue + (isNaN(total) ? 0 : total)
              })
            }
          })
        }
      } catch (error) {
        // Skip invalid JSON
      }
    })

    // Aggregate order line items by product for previous month
    const prevOrderSales = new Map<string, { quantity: number; revenue: number }>()
    prevOrders.forEach(order => {
      try {
        const lineItems = typeof order.lineItems === 'string'
          ? JSON.parse(order.lineItems)
          : order.lineItems || []

        if (Array.isArray(lineItems)) {
          lineItems.forEach((item: any) => {
            const productId = String(item.product_id || item.id || '')
            if (productId) {
              const quantity = parseInt(item.quantity || '0', 10)
              const total = parseFloat(item.total || '0')

              const current = prevOrderSales.get(productId) || { quantity: 0, revenue: 0 }
              prevOrderSales.set(productId, {
                quantity: current.quantity + (isNaN(quantity) ? 0 : quantity),
                revenue: current.revenue + (isNaN(total) ? 0 : total)
              })
            }
          })
        }
      } catch (error) {
        // Skip invalid JSON
      }
    })

    // Merge current month data
    const currentMonthSales = new Map<string, { quantity: number; revenue: number }>()

    // Add POS sales
    currentPOSSales.forEach(sale => {
      const productId = sale.productId
      const quantity = sale._sum.quantity || 0
      const revenue = Number(sale._sum.total || 0)

      currentMonthSales.set(productId, { quantity, revenue })
    })

    // Add order sales
    currentOrderSales.forEach((data, productId) => {
      const current = currentMonthSales.get(productId) || { quantity: 0, revenue: 0 }
      currentMonthSales.set(productId, {
        quantity: current.quantity + data.quantity,
        revenue: current.revenue + data.revenue
      })
    })

    // Merge previous month data
    const prevMonthSales = new Map<string, { quantity: number; revenue: number }>()

    // Add POS sales
    prevPOSSales.forEach(sale => {
      const productId = sale.productId
      const quantity = sale._sum.quantity || 0
      const revenue = Number(sale._sum.total || 0)

      prevMonthSales.set(productId, { quantity, revenue })
    })

    // Add order sales
    prevOrderSales.forEach((data, productId) => {
      const current = prevMonthSales.get(productId) || { quantity: 0, revenue: 0 }
      prevMonthSales.set(productId, {
        quantity: current.quantity + data.quantity,
        revenue: current.revenue + data.revenue
      })
    })

    // Get all unique product IDs
    const allProductIds = new Set([
      ...Array.from(currentMonthSales.keys()),
      ...Array.from(prevMonthSales.keys())
    ])

    // Fetch product details
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: Array.from(allProductIds)
        }
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        price: true,
        images: true
      }
    })

    // Build product sales data with growth calculation
    const productSalesData: ProductSales[] = []

    products.forEach(product => {
      const currentData = currentMonthSales.get(product.id)
      const prevData = prevMonthSales.get(product.id)

      // Skip products with no sales in either month
      if (!currentData && !prevData) return

      // Parse images JSON
      let imageUrl: string | null = null
      try {
        const images = typeof product.images === 'string'
          ? JSON.parse(product.images)
          : product.images || []

        if (Array.isArray(images) && images.length > 0) {
          imageUrl = images[0]
        }
      } catch (error) {
        // Skip invalid JSON
      }

      // Calculate growth percentage
      let growth = 0
      const currentRevenue = currentData?.revenue || 0
      const prevRevenue = prevData?.revenue || 0

      if (prevRevenue > 0 && currentRevenue > 0) {
        growth = ((currentRevenue - prevRevenue) / prevRevenue) * 100
      } else if (currentRevenue > 0 && prevRevenue === 0) {
        growth = 100 // New this month
      } else if (prevRevenue > 0 && currentRevenue === 0) {
        growth = -100 // Dropped to zero
      }

      productSalesData.push({
        productId: product.id,
        name: product.name,
        image: imageUrl,
        unitsSold: currentData?.quantity || 0,
        revenue: Math.round(currentRevenue * 100) / 100,
        growth: Math.round(growth * 100) / 100,
        stock: product.stockQuantity,
        price: product.price || undefined
      })
    })

    // Calculate top sellers (by revenue)
    const topSellers = productSalesData
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Calculate trending (positive growth, sorted by growth percentage)
    const trending = productSalesData
      .filter(p => (p.growth || 0) > 0)
      .sort((a, b) => (b.growth || 0) - (a.growth || 0))
      .slice(0, 10)

    // Calculate push these (trending products with stock available, sorted by revenue * growth)
    const pushThese = productSalesData
      .filter(p => (p.growth || 0) > 0 && (p.stock || 0) > 0)
      .sort((a, b) => {
        const scoreA = a.revenue * (a.growth || 0) * Math.log2((a.stock || 1) + 1)
        const scoreB = b.revenue * (b.growth || 0) * Math.log2((b.stock || 1) + 1)
        return scoreB - scoreA
      })
      .slice(0, 10)

    // Calculate declining (negative growth, sorted by growth ascending)
    const declining = productSalesData
      .filter(p => (p.growth || 0) < 0)
      .sort((a, b) => (a.growth || 0) - (b.growth || 0))
      .slice(0, 10)

    // --- Top Customers ---
    const customerMap = new Map<string, { name: string; email: string; orders: number; revenue: number; lastOrder: string }>()

    // Aggregate from WooCommerce orders
    const customerOrders = await prisma.order.findMany({
      where: {
        dateCreated: { gte: currentStartOfMonth, lte: currentEndOfMonth }
      },
      select: {
        customerId: true,
        customer: true,
        billingAddress: true,
        total: true,
        dateCreated: true
      }
    })

    customerOrders.forEach(order => {
      let name = 'Guest'
      let email = ''

      try {
        const cust = typeof order.customer === 'string' ? JSON.parse(order.customer) : order.customer || {}
        const billing = typeof order.billingAddress === 'string' ? JSON.parse(order.billingAddress) : order.billingAddress || {}

        name = [cust.first_name || billing.first_name, cust.last_name || billing.last_name].filter(Boolean).join(' ') || 'Guest'
        email = cust.email || billing.email || ''
      } catch {
        // skip
      }

      const key = email || `woo-${order.customerId || 'guest'}`
      const existing = customerMap.get(key) || { name, email, orders: 0, revenue: 0, lastOrder: '' }
      const total = parseFloat(order.total || '0') || 0
      const dateStr = order.dateCreated?.toISOString().split('T')[0] || ''

      customerMap.set(key, {
        name: existing.name || name,
        email: existing.email || email,
        orders: existing.orders + 1,
        revenue: existing.revenue + total,
        lastOrder: dateStr > existing.lastOrder ? dateStr : existing.lastOrder
      })
    })

    // Aggregate from POS sales
    const posCustomerSales = await prisma.pOSSale.findMany({
      where: {
        saleDate: { gte: currentStartOfMonth, lte: currentEndOfMonth },
        status: 'COMPLETED',
        customerId: { not: null }
      },
      select: {
        totalAmount: true,
        saleDate: true,
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        }
      }
    })

    posCustomerSales.forEach(sale => {
      if (!sale.customer) return
      const custName = [sale.customer.firstName, sale.customer.lastName].filter(Boolean).join(' ') || 'POS Customer'
      const key = sale.customer.email || `pos-${sale.customer.id}`
      const existing = customerMap.get(key) || { name: custName, email: sale.customer.email || '', orders: 0, revenue: 0, lastOrder: '' }
      const dateStr = sale.saleDate.toISOString().split('T')[0]

      customerMap.set(key, {
        name: existing.name || custName,
        email: existing.email || sale.customer.email || '',
        orders: existing.orders + 1,
        revenue: existing.revenue + Number(sale.totalAmount),
        lastOrder: dateStr > existing.lastOrder ? dateStr : existing.lastOrder
      })
    })

    const topCustomers = Array.from(customerMap.values())
      .filter(c => c.name !== 'Guest')
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15)
      .map(c => ({
        ...c,
        revenue: Math.round(c.revenue * 100) / 100
      }))

    return NextResponse.json({
      success: true,
      topSellers,
      trending,
      pushThese,
      declining,
      topCustomers
    })

  } catch (error) {
    console.error('Sales targets products GET error:', error)
    return NextResponse.json({
      success: true,
      topSellers: [],
      trending: [],
      pushThese: [],
      declining: [],
      topCustomers: [],
      error: 'Failed to fetch product analytics'
    }, { status: 200 }) // Return 200 with empty arrays to prevent breaking UI
  }
}
