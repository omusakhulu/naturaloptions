import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { wooClient } from '@/lib/woocommerce'

export async function GET() {
  try {
    // Fetch POS sales from database
    const posSales = await prisma.pOSSale.findMany({
      include: {
        customer: true,
        terminal: {
          include: {
            location: true
          }
        },
        employee: true,
        saleItems: {
          include: {
            product: true
          }
        },
        payments: true
      },
      orderBy: {
        saleDate: 'desc'
      }
    })

    // Fetch WooCommerce orders
    let wooOrders = []
    try {
      wooOrders = await wooClient.get('orders', {
        params: {
          per_page: 100,
          orderby: 'date',
          order: 'desc'
        }
      })
    } catch (wooError) {
      console.error('Error fetching WooCommerce orders:', wooError)
    }

    // Transform POS sales to unified format
    const transformedPosSales = posSales.map(sale => {
      const totalItems = sale.saleItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalPaid = sale.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)
      const sellDue = parseFloat(sale.totalAmount) - totalPaid

      return {
        id: sale.id,
        source: 'POS',
        date: sale.saleDate.toISOString().split('T')[0],
        invoiceNo: sale.saleNumber,
        customer: sale.customer ? `${sale.customer.firstName || ''} ${sale.customer.lastName || ''}`.trim() : 'Walk-in Customer',
        contact: sale.customer?.phone || 'N/A',
        location: sale.terminal?.location?.name || 'N/A',
        paymentStatus: sale.paymentStatus,
        paymentMethod: sale.paymentMethod,
        totalAmount: parseFloat(sale.totalAmount),
        totalPaid: totalPaid,
        sellDue: sellDue,
        sellReturnDue: 0,
        shippingStatus: 'N/A',
        totalItems: totalItems,
        serviceType: 'POS',
        status: sale.status,
        rawData: sale
      }
    })

    // Transform WooCommerce orders to unified format
    const transformedWooOrders = wooOrders.map(order => {
      const totalItems = order.line_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
      const totalPaid = parseFloat(order.total || 0)
      const isPaid = order.status === 'completed' || order.status === 'processing'
      const sellDue = isPaid ? 0 : totalPaid

      return {
        id: `woo-${order.id}`,
        source: 'WooCommerce',
        date: order.date_created ? order.date_created.split('T')[0] : 'N/A',
        invoiceNo: `#${order.number || order.id}`,
        customer: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim() || 'Guest',
        contact: order.billing?.phone || 'N/A',
        location: 'Online Store',
        paymentStatus: isPaid ? 'PAID' : order.status === 'pending' ? 'PENDING' : 'DUE',
        paymentMethod: order.payment_method_title || order.payment_method || 'N/A',
        totalAmount: parseFloat(order.total || 0),
        totalPaid: isPaid ? totalPaid : 0,
        sellDue: sellDue,
        sellReturnDue: parseFloat(order.total_refunded || 0),
        shippingStatus: order.status === 'completed' ? 'Delivered' : order.status === 'processing' ? 'Processing' : 'Pending',
        totalItems: totalItems,
        serviceType: 'Online',
        status: order.status,
        rawData: order
      }
    })

    // Combine and sort by date
    const allSales = [...transformedPosSales, ...transformedWooOrders].sort((a, b) => {
      return new Date(b.date) - new Date(a.date)
    })

    return NextResponse.json({
      success: true,
      sales: allSales,
      stats: {
        totalSales: allSales.length,
        posSales: transformedPosSales.length,
        wooCommerceSales: transformedWooOrders.length,
        totalRevenue: allSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
        totalPaid: allSales.reduce((sum, sale) => sum + sale.totalPaid, 0),
        totalDue: allSales.reduce((sum, sale) => sum + sale.sellDue, 0)
      }
    })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales', details: error.message },
      { status: 500 }
    )
  }
}
