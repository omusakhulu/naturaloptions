import { NextRequest, NextResponse } from 'next/server'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

function isPOSOrder(order: any) {
  const via = String(order?.created_via || '').toLowerCase()
  const viaHit = /pos|point[- ]?of[- ]?sale|woocommerce-pos|wc_pos|wepos/.test(via)
  const meta = Array.isArray(order?.meta_data) ? order.meta_data : []
  const metaHit = meta.some((m: any) => {
    const k = String(m?.key || '').toLowerCase()
    const v = String(m?.value || '').toLowerCase()
    return /pos|wc_pos|pos_register|wepos|point.?of.?sale/.test(k) || /pos/.test(v)
  })
  return viaHit || metaHit
}

function toRow(order: any) {
  const date = order?.date_created ? new Date(order.date_created) : new Date()
  const totalAmount = parseFloat(order?.total || '0') || 0
  const paid = ['completed', 'processing'].includes(String(order?.status || '').toLowerCase())
  const totalPaid = paid ? totalAmount : 0
  const sellDue = Math.max(0, totalAmount - totalPaid)
  const totalItems = Array.isArray(order?.line_items) ? order.line_items.reduce((s: number, li: any) => s + (li?.quantity || 0), 0) : 0
  return {
    date: date.toLocaleDateString('en-GB'),
    invoiceNo: String(order?.number ?? order?.id ?? ''),
    customer: order?.billing?.first_name || order?.billing?.last_name ? `${order.billing.first_name || ''} ${order.billing.last_name || ''}`.trim() : 'NATURAL OPTIONS',
    contact: order?.billing?.phone || '',
    location: 'NATURAL OPTIONS',
    paymentStatus: paid ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Due',
    paymentMethod: order?.payment_method_title || order?.payment_method || '',
    totalAmount,
    totalPaid,
    sellDue,
    sellReturnDue: 0,
    shippingStatus: '',
    totalItems
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const maxPages = Math.min(parseInt(searchParams.get('maxPages') || '5', 10) || 5, 10)
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '100', 10) || 100, 100)

    const woo = WooCommerceService.getInstance()

    let allOrders: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore && page <= maxPages) {
      const orders = await woo.executeApiRequest(
        `/wp-json/wc/v3/orders?status=any&orderby=date&order=desc&per_page=${perPage}&page=${page}`,
        'GET'
      )

      if (!Array.isArray(orders) || orders.length === 0) {
        hasMore = false
      } else {
        allOrders = allOrders.concat(orders)
        page++
      }
    }

    const posOrders = allOrders.filter(isPOSOrder)
    const items = posOrders.map(toRow)

    const summary = items.reduce(
      (acc, r) => {
        acc.totalAmount += r.totalAmount
        acc.totalPaid += r.totalPaid
        acc.sellDue += r.sellDue
        acc.sellReturnDue += r.sellReturnDue
        acc.totalItems += r.totalItems
        if (r.paymentStatus === 'Paid') acc.statusPaid++
        else if (r.paymentStatus === 'Partial') acc.statusPartial++
        else acc.statusDue++
        const pm = String(r.paymentMethod || '').toLowerCase()
        if (pm.includes('cash')) acc.pmCash++
        else if (pm.includes('mpesa')) acc.pmMpesa++
        else if (pm.includes('card')) acc.pmCard++
        else if (pm.includes('bank')) acc.pmBank++
        else if (pm.includes('multiple')) acc.pmMultiple++
        return acc
      },
      {
        totalAmount: 0,
        totalPaid: 0,
        sellDue: 0,
        sellReturnDue: 0,
        totalItems: 0,
        statusPaid: 0,
        statusDue: 0,
        statusPartial: 0,
        pmCash: 0,
        pmMpesa: 0,
        pmCard: 0,
        pmMultiple: 0,
        pmBank: 0
      }
    )

    return NextResponse.json({ count: items.length, items, summary })
  } catch (error: any) {
    console.error('Failed to fetch POS orders:', error?.message || error)
    return NextResponse.json(
      {
        error: 'Failed to fetch POS orders',
        items: [],
        summary: {
          totalAmount: 0,
          totalPaid: 0,
          sellDue: 0,
          sellReturnDue: 0,
          totalItems: 0,
          statusPaid: 0,
          statusDue: 0,
          statusPartial: 0,
          pmCash: 0,
          pmMpesa: 0,
          pmCard: 0,
          pmMultiple: 0,
          pmBank: 0
        }
      },
      { status: 200 }
    )
  }
}
