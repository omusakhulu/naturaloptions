import { NextRequest, NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'
import { saveOrder } from '@/lib/db/orders'

/**
 * Update order status in WooCommerce
 * PUT /api/woocommerce/orders/[id]/status
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 })
    }

    // Valid WooCommerce order statuses
    const validStatuses = [
      'pending',
      'processing',
      'on-hold',
      'completed',
      'cancelled',
      'refunded',
      'failed'
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        },
        { status: 400 }
      )
    }

    console.log(`🔄 Updating order ${id} status to: ${status}`)

    const woo = WooCommerceService.getInstance()

    // Update order in WooCommerce
    const updatedOrder = await woo.updateOrder(parseInt(id), { status }) as any

    console.log(`✅ Order ${id} status updated to ${status} in WooCommerce`)

    // Also update in local database
    try {
      await saveOrder({
        id: updatedOrder.id,
        order_number: updatedOrder.number || updatedOrder.id.toString(),
        status: updatedOrder.status,
        total: updatedOrder.total,
        subtotal: updatedOrder.subtotal,
        shipping_total: updatedOrder.shipping_total,
        tax_total: updatedOrder.tax_total,
        discount_total: updatedOrder.discount_total,
        payment_method: updatedOrder.payment_method,
        payment_method_title: updatedOrder.payment_method_title,
        customer_note: updatedOrder.customer_note,
        customer_id: updatedOrder.customer_id,
        date_created: updatedOrder.date_created,
        date_paid: updatedOrder.date_paid,
        date_completed: updatedOrder.date_completed,
        shipping: updatedOrder.shipping,
        billing: updatedOrder.billing,
        line_items: updatedOrder.line_items
      })

      console.log(`✅ Order ${id} status updated in local database`)
    } catch (dbError) {
      console.warn('⚠️ Failed to update order in local database:', dbError)
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        id: updatedOrder.id,
        number: updatedOrder.number,
        status: updatedOrder.status,
        total: updatedOrder.total,
        dateModified: updatedOrder.date_modified
      }
    })
  } catch (error) {
    console.error('Error updating order status:', error)

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to update order status'
      },
      { status: 500 }
    )
  }
}

/**
 * Get available order statuses
 * GET /api/woocommerce/orders/[id]/status
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const woo = WooCommerceService.getInstance()

    // Get current order
    const order = await woo.getOrder(parseInt(id)) as any

    // Available statuses
    const statuses = [
      { key: 'pending', label: 'Pending Payment', color: 'warning' },
      { key: 'processing', label: 'Processing', color: 'info' },
      { key: 'on-hold', label: 'On Hold', color: 'warning' },
      { key: 'completed', label: 'Completed', color: 'success' },
      { key: 'cancelled', label: 'Cancelled', color: 'error' },
      { key: 'refunded', label: 'Refunded', color: 'default' },
      { key: 'failed', label: 'Failed', color: 'error' }
    ]

    return NextResponse.json({
      success: true,
      currentStatus: order.status,
      statuses
    })
  } catch (error) {
    console.error('Error fetching order statuses:', error)

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Failed to fetch order statuses'
      },
      { status: 500 }
    )
  }
}
