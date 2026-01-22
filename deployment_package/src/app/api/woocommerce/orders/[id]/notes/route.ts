import { NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const idNum = Number(id)

    if (!idNum || Number.isNaN(idNum)) {
      return NextResponse.json({ success: false, error: 'Invalid order id' }, { status: 400 })
    }

    const woo = WooCommerceService.getInstance()

    const notes = await (woo as any).executeApiRequest(
      `/wp-json/wc/v3/orders/${idNum}/notes?per_page=100&order=asc`,
      'GET'
    )

    return NextResponse.json({ success: true, notes: Array.isArray(notes) ? notes : [notes] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch order notes' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const idNum = Number(id)

    if (!idNum || Number.isNaN(idNum)) {
      return NextResponse.json({ success: false, error: 'Invalid order id' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const { note, customer_note } = body || {}

    if (!note || typeof note !== 'string') {
      return NextResponse.json({ success: false, error: 'Note text is required' }, { status: 400 })
    }

    const woo = WooCommerceService.getInstance()

    const created = await (woo as any).executeApiRequest(`/wp-json/wc/v3/orders/${idNum}/notes`, 'POST', {
      note,
      customer_note: Boolean(customer_note)
    })

    return NextResponse.json({ success: true, note: created })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to create order note' }, { status: 500 })
  }
}
