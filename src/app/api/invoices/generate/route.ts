import { NextRequest, NextResponse } from 'next/server'

import { getAllOrders } from '@/lib/db/orders'
import { upsertInvoiceByOrderId, getInvoiceByOrderId } from '@/lib/db/invoices'

export async function POST(request: NextRequest) {
  try {
    // Fetch all orders from database
    const orders = await getAllOrders()

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orders found',
        invoicesCreated: 0
      })
    }

    let invoicesCreated = 0
    const errors = []

    // Create invoices for each order that doesn't have one
    for (const order of orders) {
      try {
        const existingInvoice = await getInvoiceByOrderId(order.wooId)
        const invoiceNumber = existingInvoice?.invoiceNumber || `INV-${order.wooId}-${Date.now()}`

        // Parse line items
        let lineItems = []
        try {
          lineItems = order.lineItems ? JSON.parse(order.lineItems) : []
        } catch (e) {
          console.warn(`Failed to parse line items for order ${order.wooId}`)
        }

        // Parse billing address
        let billingAddress: any = {}
        try {
          billingAddress = order.billingAddress ? JSON.parse(order.billingAddress) : {}
        } catch (e) {
          console.warn(`Failed to parse billing address for order ${order.wooId}`)
        }

        // Parse customer data
        let customerName = 'Unknown'
        let customerEmail = 'unknown@example.com'
        try {
          const customerData = order.customer ? JSON.parse(order.customer) : {}
          customerName = `${billingAddress.first_name || ''} ${billingAddress.last_name || ''}`.trim() || 'Unknown'
          customerEmail = billingAddress.email || customerData.email || 'unknown@example.com'
        } catch (e) {
          console.warn(`Failed to parse customer data for order ${order.wooId}`)
        }

        // Determine invoice lifecycle (forward-only)
        const orderStatus = order.status
        const existingLifecycle: string | undefined = existingInvoice?.status
        let lifecycle: 'draft' | 'sent' | 'partially_paid' | 'paid' = 'draft'

        if (existingLifecycle === 'paid') {
          lifecycle = 'paid'
        } else if (orderStatus === 'completed') {
          lifecycle = 'paid'
        } else if (existingLifecycle === 'partially_paid') {
          lifecycle = 'partially_paid'
        } else if (existingLifecycle === 'sent') {
          lifecycle = 'sent'
        } else {
          lifecycle = 'draft'
        }

        const invoice = await upsertInvoiceByOrderId(order.wooId, {
          orderId: order.wooId,
          invoiceNumber,
          customerId: order.customerId || undefined,
          status: lifecycle,
          orderStatus,
          amount: order.total || '0',
          date: order.dateCreated || new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          customerName,
          customerEmail,
          billingAddress,
          lineItems
        })

        if (invoice && !existingInvoice) {
          invoicesCreated++
          console.log(`✅ Created invoice ${invoiceNumber} for order ${order.wooId}`)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Order ${order.wooId}: ${errorMsg}`)
        console.error(`Failed to create invoice for order ${order.wooId}:`, errorMsg)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${invoicesCreated} invoices from ${orders.length} orders`,
      invoicesCreated,
      totalOrders: orders.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Error generating invoices:', error)

    return NextResponse.json(
      {
        error: 'Failed to generate invoices',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
