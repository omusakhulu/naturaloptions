import { NextResponse } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'

import prisma from '@/lib/prisma'

// Generate unique shift number
async function generateShiftNumber(): Promise<string> {
  const date = new Date()
  const prefix = `SH-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  
  const lastShift = await prisma.pOSShift.findFirst({
    where: { shiftNumber: { startsWith: prefix } },
    orderBy: { shiftNumber: 'desc' }
  })

  if (lastShift) {
    const lastNumber = parseInt(lastShift.shiftNumber.split('-').pop() || '0')
    return `${prefix}-${String(lastNumber + 1).padStart(3, '0')}`
  }
  
  return `${prefix}-001`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const terminalId = searchParams.get('terminalId')
    const employeeId = searchParams.get('employeeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const current = searchParams.get('current') // Get current open shift

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (terminalId) {
      where.terminalId = terminalId
    }

    if (employeeId) {
      where.employeeId = employeeId
    }

    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) where.startTime.gte = new Date(startDate)
      if (endDate) where.startTime.lte = new Date(endDate)
    }

    // If requesting current open shift
    if (current === 'true') {
      const openShift = await prisma.pOSShift.findFirst({
        where: {
          status: 'OPEN',
          ...(terminalId && { terminalId }),
          ...(employeeId && { employeeId })
        },
        include: {
          terminal: { select: { id: true, name: true } },
          employee: { select: { id: true, name: true, email: true } },
          cashMovements: { orderBy: { performedAt: 'desc' } }
        }
      })

      return NextResponse.json({ shift: openShift })
    }

    const [shifts, total] = await Promise.all([
      prisma.pOSShift.findMany({
        where,
        include: {
          terminal: { select: { id: true, name: true } },
          employee: { select: { id: true, name: true, email: true } },
          _count: { select: { cashMovements: true } }
        },
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.pOSShift.count({ where })
    ])

    // Get summary stats
    const stats = await prisma.pOSShift.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { totalSales: true, totalRefunds: true }
    })

    return NextResponse.json({
      shifts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    })
  } catch (error: any) {
    console.error('Error fetching POS shifts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shifts', details: error.message },
      { status: 500 }
    )
  }
}

// Open a new shift
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { terminalId, employeeId, openingCash, notes } = data

    if (!terminalId || !employeeId) {
      return NextResponse.json(
        { error: 'Terminal ID and Employee ID are required' },
        { status: 400 }
      )
    }

    if (openingCash === undefined || openingCash === null) {
      return NextResponse.json(
        { error: 'Opening cash amount is required' },
        { status: 400 }
      )
    }

    // Check for existing open shift on this terminal
    const existingShift = await prisma.pOSShift.findFirst({
      where: {
        terminalId,
        status: 'OPEN'
      }
    })

    if (existingShift) {
      return NextResponse.json(
        { error: 'Terminal already has an open shift. Please close it first.' },
        { status: 400 }
      )
    }

    // Check if employee already has an open shift
    const employeeShift = await prisma.pOSShift.findFirst({
      where: {
        employeeId,
        status: 'OPEN'
      }
    })

    if (employeeShift) {
      return NextResponse.json(
        { error: 'Employee already has an open shift on another terminal.' },
        { status: 400 }
      )
    }

    const shiftNumber = await generateShiftNumber()

    const shift = await prisma.$transaction(async (tx) => {
      // Create the shift
      const newShift = await tx.pOSShift.create({
        data: {
          shiftNumber,
          terminalId,
          employeeId,
          openingCash: new Decimal(openingCash),
          status: 'OPEN',
          notes: notes || null,
          paymentBreakdown: JSON.stringify({})
        },
        include: {
          terminal: { select: { id: true, name: true } },
          employee: { select: { id: true, name: true, email: true } }
        }
      })

      // Record opening float as cash movement
      await tx.cashMovement.create({
        data: {
          shiftId: newShift.id,
          type: 'FLOAT',
          amount: new Decimal(openingCash),
          reason: 'Opening float',
          performedBy: employeeId
        }
      })

      // Update terminal last used
      await tx.pOSTerminal.update({
        where: { id: terminalId },
        data: { lastUsedAt: new Date() }
      })

      return newShift
    })

    return NextResponse.json(shift, { status: 201 })
  } catch (error: any) {
    console.error('Error opening shift:', error)
    return NextResponse.json(
      { error: 'Failed to open shift', details: error.message },
      { status: 500 }
    )
  }
}

// Update shift (close, add cash movement, sync)
export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id, action, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: 'Shift ID is required' }, { status: 400 })
    }

    const existingShift = await prisma.pOSShift.findUnique({
      where: { id },
      include: { cashMovements: true }
    })

    if (!existingShift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    // Handle different actions
    switch (action) {
      case 'close': {
        if (existingShift.status !== 'OPEN') {
          return NextResponse.json(
            { error: 'Only open shifts can be closed' },
            { status: 400 }
          )
        }

        const { closingCash, closedBy } = updateData

        if (closingCash === undefined) {
          return NextResponse.json(
            { error: 'Closing cash amount is required' },
            { status: 400 }
          )
        }

        // Calculate expected cash
        const openingCash = existingShift.openingCash
        const cashSales = existingShift.cashMovements
          .filter(m => m.type === 'SALE')
          .reduce((sum, m) => sum.add(m.amount), new Decimal(0))
        const cashRefunds = existingShift.cashMovements
          .filter(m => m.type === 'REFUND')
          .reduce((sum, m) => sum.add(m.amount), new Decimal(0))
        const payIns = existingShift.cashMovements
          .filter(m => m.type === 'PAY_IN')
          .reduce((sum, m) => sum.add(m.amount), new Decimal(0))
        const payOuts = existingShift.cashMovements
          .filter(m => m.type === 'PAY_OUT')
          .reduce((sum, m) => sum.add(m.amount), new Decimal(0))
        const drops = existingShift.cashMovements
          .filter(m => m.type === 'DROP')
          .reduce((sum, m) => sum.add(m.amount), new Decimal(0))

        const expectedCash = new Decimal(openingCash.toString())
          .add(cashSales)
          .sub(cashRefunds)
          .add(payIns)
          .sub(payOuts)
          .sub(drops)

        const discrepancy = new Decimal(closingCash).sub(expectedCash)

        const closedShift = await prisma.pOSShift.update({
          where: { id },
          data: {
            status: 'CLOSED',
            endTime: new Date(),
            closingCash: new Decimal(closingCash),
            expectedCash,
            cashDiscrepancy: discrepancy,
            closedBy: closedBy || existingShift.employeeId,
            notes: updateData.notes || existingShift.notes
          },
          include: {
            terminal: { select: { id: true, name: true } },
            employee: { select: { id: true, name: true, email: true } },
            cashMovements: { orderBy: { performedAt: 'desc' } }
          }
        })

        return NextResponse.json(closedShift)
      }

      case 'pay_in':
      case 'pay_out':
      case 'drop': {
        const { amount, reason, performedBy } = updateData

        if (!amount || !reason) {
          return NextResponse.json(
            { error: 'Amount and reason are required' },
            { status: 400 }
          )
        }

        const movementType = action === 'pay_in' ? 'PAY_IN' : action === 'pay_out' ? 'PAY_OUT' : 'DROP'

        const movement = await prisma.$transaction(async (tx) => {
          // Create cash movement
          const newMovement = await tx.cashMovement.create({
            data: {
              shiftId: id,
              type: movementType,
              amount: new Decimal(amount),
              reason,
              performedBy: performedBy || existingShift.employeeId
            }
          })

          // Update shift totals
          const updateField = movementType === 'PAY_IN' ? 'cashIn' : 'cashOut'
          await tx.pOSShift.update({
            where: { id },
            data: {
              [updateField]: {
                increment: new Decimal(amount)
              }
            }
          })

          return newMovement
        })

        return NextResponse.json(movement)
      }

      case 'sync': {
        // Sync shift data with sales from the terminal
        const sales = await prisma.pOSSale.findMany({
          where: {
            terminalId: existingShift.terminalId,
            saleDate: {
              gte: existingShift.startTime,
              ...(existingShift.endTime && { lte: existingShift.endTime })
            }
          },
          include: { payments: true }
        })

        // Calculate totals
        const totalSales = sales
          .filter(s => s.status === 'COMPLETED')
          .reduce((sum, s) => sum.add(s.totalAmount), new Decimal(0))

        const totalRefunds = sales
          .filter(s => s.status === 'REFUNDED' || s.status === 'PARTIALLY_REFUNDED')
          .reduce((sum, s) => sum.add(s.totalAmount), new Decimal(0))

        const totalVoids = sales
          .filter(s => s.status === 'VOIDED')
          .reduce((sum, s) => sum.add(s.totalAmount), new Decimal(0))

        // Calculate payment breakdown
        const paymentBreakdown: Record<string, number> = {}
        for (const sale of sales) {
          if (sale.status === 'COMPLETED') {
            for (const payment of sale.payments) {
              const method = payment.paymentMethod
              paymentBreakdown[method] = (paymentBreakdown[method] || 0) + parseFloat(payment.amount.toString())
            }
          }
        }

        const syncedShift = await prisma.pOSShift.update({
          where: { id },
          data: {
            totalSales,
            totalRefunds,
            totalVoids,
            transactionCount: sales.length,
            paymentBreakdown: JSON.stringify(paymentBreakdown)
          },
          include: {
            terminal: { select: { id: true, name: true } },
            employee: { select: { id: true, name: true, email: true } },
            cashMovements: { orderBy: { performedAt: 'desc' } }
          }
        })

        return NextResponse.json(syncedShift)
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error updating shift:', error)
    return NextResponse.json(
      { error: 'Failed to update shift', details: error.message },
      { status: 500 }
    )
  }
}
