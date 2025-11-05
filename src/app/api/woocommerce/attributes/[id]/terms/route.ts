import { NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

// GET terms for a specific attribute
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = Number(resolvedParams?.id)

    if (!id || Number.isNaN(id))
      return NextResponse.json({ success: false, error: 'Invalid attribute id' }, { status: 400 })

    const woo = WooCommerceService.getInstance()

    const terms = await (woo as any).executeApiRequest(
      `/wp-json/wc/v3/products/attributes/${id}/terms?per_page=100&orderby=name&order=asc`,
      'GET'
    )

    return NextResponse.json({ success: true, terms: Array.isArray(terms) ? terms : [terms] })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch attribute terms' },
      { status: 500 }
    )
  }
}

// POST create a term for a specific attribute
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = Number(resolvedParams?.id)

    if (!id || Number.isNaN(id))
      return NextResponse.json({ success: false, error: 'Invalid attribute id' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const { name, slug, description, menu_order } = body || {}

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    const payload: any = { name }

    if (typeof slug === 'string') payload.slug = slug
    if (typeof description === 'string') payload.description = description
    if (Number.isInteger(menu_order)) payload.menu_order = menu_order

    const woo = WooCommerceService.getInstance()

    const created = await (woo as any).executeApiRequest(
      `/wp-json/wc/v3/products/attributes/${id}/terms`,
      'POST',
      payload
    )

    return NextResponse.json({ success: true, term: created })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create attribute term' },
      { status: 500 }
    )
  }
}
