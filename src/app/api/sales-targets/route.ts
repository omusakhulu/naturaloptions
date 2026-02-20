import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/config/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

interface DailySale {
  date: string
  amount: number
}

interface ProgressData {
  achieved: number
  remaining: number
  percentComplete: number
  daysElapsed: number
  daysRemaining: number
  daysInMonth: number
  dailyAverage: number
  dailyRequired: number
  onTrack: boolean
  dailySales: DailySale[]
}

/**
 * GET /api/sales-targets
 * Fetch sales target and calculate progress for a given month/year
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
        target: null,
        progress: null,
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

    // Get the sales target for this month/year
    const target = await prisma.salesTarget.findUnique({
      where: {
        month_year: { month, year }
      }
    })

    // If no target exists, return null
    if (!target) {
      return NextResponse.json({
        success: true,
        target: null,
        progress: null
      })
    }

    // Calculate date range for the month
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)
    const today = new Date()
    const currentDate = today > endOfMonth ? endOfMonth : today

    // Calculate days
    const daysInMonth = endOfMonth.getDate()
    const daysElapsed = currentDate.getDate()
    const daysRemaining = Math.max(0, daysInMonth - daysElapsed)

    // Fetch orders for the month
    const orders = await prisma.order.findMany({
      where: {
        dateCreated: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      select: {
        total: true,
        dateCreated: true
      }
    })

    // Fetch POS sales for the month
    const posSales = await prisma.pOSSale.findMany({
      where: {
        saleDate: {
          gte: startOfMonth,
          lte: endOfMonth
        },
        status: 'COMPLETED'
      },
      select: {
        totalAmount: true,
        saleDate: true
      }
    })

    // Calculate total revenue from orders
    const orderTotal = orders.reduce((sum, order) => {
      const total = parseFloat(order.total || '0')
      return sum + (isNaN(total) ? 0 : total)
    }, 0)

    // Calculate total revenue from POS sales
    const posTotal = posSales.reduce((sum, sale) => {
      return sum + Number(sale.totalAmount)
    }, 0)

    // Total achieved
    const achieved = orderTotal + posTotal

    // Convert target revenue to number
    const targetRevenue = Number(target.revenueTarget)
    const remaining = Math.max(0, targetRevenue - achieved)
    const percentComplete = targetRevenue > 0 ? (achieved / targetRevenue) * 100 : 0

    // Calculate averages
    const dailyAverage = daysElapsed > 0 ? achieved / daysElapsed : 0
    const dailyRequired = daysRemaining > 0 ? remaining / daysRemaining : 0

    // Determine if on track
    const expectedProgress = daysElapsed > 0 ? (daysElapsed / daysInMonth) * 100 : 0
    const onTrack = percentComplete >= expectedProgress

    // Build daily sales array
    const dailySalesMap = new Map<string, number>()

    // Aggregate orders by day
    orders.forEach(order => {
      if (order.dateCreated) {
        const dateKey = order.dateCreated.toISOString().split('T')[0]
        const total = parseFloat(order.total || '0')
        const current = dailySalesMap.get(dateKey) || 0
        dailySalesMap.set(dateKey, current + (isNaN(total) ? 0 : total))
      }
    })

    // Aggregate POS sales by day
    posSales.forEach(sale => {
      const dateKey = sale.saleDate.toISOString().split('T')[0]
      const current = dailySalesMap.get(dateKey) || 0
      dailySalesMap.set(dateKey, current + Number(sale.totalAmount))
    })

    // Convert to array and sort
    const dailySales: DailySale[] = Array.from(dailySalesMap.entries())
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const progress: ProgressData = {
      achieved: Math.round(achieved * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      percentComplete: Math.round(percentComplete * 100) / 100,
      daysElapsed,
      daysRemaining,
      daysInMonth,
      dailyAverage: Math.round(dailyAverage * 100) / 100,
      dailyRequired: Math.round(dailyRequired * 100) / 100,
      onTrack,
      dailySales
    }

    return NextResponse.json({
      success: true,
      target: {
        id: target.id,
        name: target.name,
        revenueTarget: Number(target.revenueTarget),
        month: target.month,
        year: target.year,
        notes: target.notes
      },
      progress
    })

  } catch (error) {
    console.error('Sales targets GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales target' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sales-targets
 * Create or update a sales target for a given month/year
 * Body: { revenueTarget: number, month: number, year: number, name?: string, notes?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 503 })
    }

    const body = await request.json()
    const { revenueTarget, month, year, name, notes } = body

    // Validate required fields
    if (typeof revenueTarget !== 'number' || revenueTarget <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid revenueTarget'
      }, { status: 400 })
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({
        success: false,
        error: 'Invalid month (1-12)'
      }, { status: 400 })
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({
        success: false,
        error: 'Invalid year'
      }, { status: 400 })
    }

    // Generate default name if not provided
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const defaultName = `${monthNames[month - 1]} ${year} Target`

    // Upsert the target
    const target = await prisma.salesTarget.upsert({
      where: {
        month_year: { month, year }
      },
      create: {
        name: name || defaultName,
        revenueTarget: new Decimal(revenueTarget),
        month,
        year,
        notes: notes || null
      },
      update: {
        ...(name ? { name } : {}),
        revenueTarget: new Decimal(revenueTarget),
        ...(notes !== undefined ? { notes: notes || null } : {})
      }
    })

    return NextResponse.json({
      success: true,
      target: {
        id: target.id,
        name: target.name,
        revenueTarget: Number(target.revenueTarget),
        month: target.month,
        year: target.year,
        notes: target.notes
      }
    })

  } catch (error) {
    console.error('Sales targets POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save sales target' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sales-targets
 * Delete a sales target by ID
 * Query param: id
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing id parameter'
      }, { status: 400 })
    }

    await prisma.salesTarget.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Sales targets DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete sales target' },
      { status: 500 }
    )
  }
}
