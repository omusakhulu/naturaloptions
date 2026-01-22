import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

import { processOrderCompletion, reverseOrderStockMovements } from '@/lib/services/warehouseStockService'

/**
 * Manually process warehouse stock for an order
 * POST /api/warehouses/process-order
 * Body: { orderId: number, action: 'reduce' | 'reverse' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, action = 'reduce' } = body

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID is required'
        },
        { status: 400 }
      )
    }

    // Fetch the order from database
    const order = await prisma.order.findUnique({
      where: { wooId: Number(orderId) }
    })

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: `Order ${orderId} not found in database`
        },
        { status: 404 }
      )
    }

    let result

    if (action === 'reverse') {
      // Reverse stock movements
      console.log(`🔄 Manually reversing stock for order ${order.orderNumber}`)
      result = await reverseOrderStockMovements(order.orderNumber)
    } else {
      // Reduce stock (default action)
      console.log(`📦 Manually processing stock for order ${order.orderNumber}`)

      // Parse line items from JSON
      let lineItems = []
      try {
        lineItems = order.lineItems ? JSON.parse(order.lineItems as string) : []
      } catch (e) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to parse order line items'
          },
          { status: 400 }
        )
      }

      if (lineItems.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Order has no line items'
          },
          { status: 400 }
        )
      }

      result = await processOrderCompletion(Number(orderId), order.orderNumber, lineItems)
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully ${action === 'reverse' ? 'reversed' : 'reduced'} warehouse stock for order ${order.orderNumber}`,
        result: {
          orderNumber: order.orderNumber,
          processedItems: result.processedItems,
          skippedItems: result.skippedItems,
          movements: result.movements.length,
          errors: result.errors
        }
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to process warehouse stock',
          details: result.errors
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error processing warehouse stock for order:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}

/**
 * Get warehouse stock movements for an order
 * GET /api/warehouses/process-order?orderId=123
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID is required'
        },
        { status: 400 }
      )
    }

    // Fetch the order from database
    const order = await prisma.order.findUnique({
      where: { wooId: Number(orderId) }
    })

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: `Order ${orderId} not found in database`
        },
        { status: 404 }
      )
    }

    // Get stock movements for this order
    const movements = await prisma.stockMovement.findMany({
      where: {
        OR: [
          { referenceNumber: `ORDER-${order.orderNumber}` },
          { referenceNumber: `RETURN-${order.orderNumber}` }
        ]
      },
      include: {
        inventory: {
          select: {
            sku: true,
            productName: true,
            quantity: true
          }
        },
        warehouse: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      movements: movements,
      count: movements.length
    })
  } catch (error: any) {
    console.error('Error fetching order stock movements:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
