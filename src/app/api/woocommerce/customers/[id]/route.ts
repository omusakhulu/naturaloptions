import { NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = Number(resolvedParams?.id)

    if (!id) return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const woo = WooCommerceService.getInstance()
    const updated = await (woo as any).executeApiRequest(`/wp-json/wc/v3/customers/${id}`, 'PUT', body)

    return NextResponse.json({ success: true, customer: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = Number(resolvedParams?.id)

    if (!id) return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })

    const woo = WooCommerceService.getInstance()

    const deleted = await (woo as any).executeApiRequest(`/wp-json/wc/v3/customers/${id}?force=true`, 'DELETE')

    return NextResponse.json({ success: true, customer: deleted })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete customer' }, { status: 500 })
  }
}
