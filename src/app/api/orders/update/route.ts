import { NextRequest, NextResponse } from 'next/server'

import { saveOrder, getOrderByWooId } from '@/lib/db/orders'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, customerNote, billingAddress, shippingAddress, lineItems } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const wooId = parseInt(orderId)

    // Fetch existing order
    const existingOrder = await getOrderByWooId(wooId)

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Build WooCommerce update payload (send only supported fields)
    const wooPayload: Record<string, any> = {}

    if (status) wooPayload.status = String(status)
    if (typeof customerNote === 'string') wooPayload.customer_note = customerNote
    if (billingAddress && typeof billingAddress === 'object') wooPayload.billing = billingAddress
    if (shippingAddress && typeof shippingAddress === 'object') wooPayload.shipping = shippingAddress

    // Map line items (add/update/delete)
    try {
      const postedItems: any[] = Array.isArray(lineItems) ? lineItems : []
      const existingItemsRaw = existingOrder.lineItems ? JSON.parse(existingOrder.lineItems) : []

      const existingLineIds = new Set<number>(
        (Array.isArray(existingItemsRaw) ? existingItemsRaw : [])
          .map((it: any) => (typeof it?.id === 'number' ? it.id : parseInt(String(it?.id))))
          .filter((n: number) => !Number.isNaN(n))
      )

      const postedByLineId = new Map<number, any>()
      const additions: any[] = []
      const updates: any[] = []

      const toNumber = (v: any) => (typeof v === 'number' ? v : parseInt(String(v)))

      const toMoney = (qty: any, price: any) => {
        const q = Number(qty)
        const p = Number(String(price).replace(/[^0-9.-]/g, ''))
        const val = !isFinite(q) || !isFinite(p) ? undefined : (q * p).toFixed(2)

        return val
      }

      for (const it of postedItems) {
        const lineId = toNumber(it?.id)
        const hasNumericLineId = !Number.isNaN(lineId)
        const qtyNum = toNumber(it?.quantity)
        const qty = Number.isNaN(qtyNum) || qtyNum <= 0 ? 1 : qtyNum

        if (hasNumericLineId && existingLineIds.has(lineId)) {
          postedByLineId.set(lineId, true)
          const payload: any = { id: lineId, quantity: qty }

          const total = toMoney(qty, it?.price)

          if (total) {
            payload.total = total
            payload.subtotal = total
          }

          updates.push(payload)
        } else if (it?.product_id) {
          const prodId = toNumber(it.product_id)

          if (!Number.isNaN(prodId)) {
            const payload: any = { product_id: prodId, quantity: qty }
            const total = toMoney(qty, it?.price)

            if (total) {
              payload.total = total
              payload.subtotal = total
            }

            if (it?.variation_id) {
              const varId = toNumber(it.variation_id)

              if (!Number.isNaN(varId)) payload.variation_id = varId
            }

            additions.push(payload)
          }
        }
      }

      // Deletions: existing lines not present in posted
      const deletions: any[] = []

      existingLineIds.forEach(id => {
        if (!postedByLineId.has(id)) {
          deletions.push({ id, quantity: 0 })
        }
      })

      const line_items_payload = [...updates, ...additions, ...deletions]

      if (line_items_payload.length > 0) {
        wooPayload.line_items = line_items_payload
      }
    } catch (e) {
      // If mapping fails, proceed with other updates instead of hard failing
      console.warn('Line items mapping skipped:', (e as Error).message)
    }

    // Update WooCommerce
    const woo = WooCommerceService.getInstance()
    const wooUpdated = await woo.updateOrder(wooId, wooPayload)

    // If a note is provided, also create an order note so it appears in Woo's timeline
    try {
      if (typeof customerNote === 'string' && customerNote.trim().length > 0) {
        await (woo as any).addOrderNote(wooId, customerNote.trim(), true, true)
      }
    } catch (noteErr) {
      console.warn('Order note creation failed (non-fatal):', noteErr instanceof Error ? noteErr.message : noteErr)
    }

    // Map Woo response to local DB shape
    const dbMapped = {
      id: wooUpdated.id,
      order_number: wooUpdated.number || String(wooUpdated.id),
      status: wooUpdated.status,
      total: wooUpdated.total,
      subtotal: wooUpdated.subtotal,
      shipping_total: wooUpdated.shipping_total,
      tax_total: wooUpdated.tax_total,
      discount_total: wooUpdated.discount_total,
      payment_method: wooUpdated.payment_method,
      payment_method_title: wooUpdated.payment_method_title,
      customer_note: wooUpdated.customer_note,
      date_created: wooUpdated.date_created,
      date_paid: wooUpdated.date_paid,
      date_completed: wooUpdated.date_completed,
      billing: wooUpdated.billing,
      shipping: wooUpdated.shipping,
      line_items: wooUpdated.line_items,
      customer_id: wooUpdated.customer_id
    }

    // Persist to local database (upsert)
    const updatedOrder = await saveOrder(dbMapped as any)

    return NextResponse.json({ success: true, message: 'Order updated', order: updatedOrder })
  } catch (error) {
    console.error('Error updating order:', error)

    return NextResponse.json(
      {
        error: 'Failed to update order',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
