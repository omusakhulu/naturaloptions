import { NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function GET() {
  try {
    const woo = WooCommerceService.getInstance()

    const attributes = await (woo as any).executeApiRequest(
      '/wp-json/wc/v3/products/attributes?per_page=100&orderby=name&order=asc',
      'GET'
    )

    return NextResponse.json({ success: true, attributes: Array.isArray(attributes) ? attributes : [attributes] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch attributes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { name, slug, type, order_by, has_archives } = body || {}

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    const payload: any = { name }

    // Sanitize slug: lowercase, trim, replace spaces, remove pa_ prefix (Woo adds it automatically)
    if (typeof slug === 'string' && slug.trim() !== '') {
      const raw = slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')
      payload.slug = raw.startsWith('pa-') ? raw.replace(/^pa-/, '') : raw.startsWith('pa_') ? raw.replace(/^pa_/, '') : raw
    }

    // Validate type
    const allowedTypes = new Set(['select', 'text'])
    if (typeof type === 'string' && allowedTypes.has(type)) payload.type = type
    else payload.type = 'select'

    // Validate order_by
    const allowedOrder = new Set(['menu_order', 'name', 'name_num', 'id'])
    if (typeof order_by === 'string' && allowedOrder.has(order_by)) payload.order_by = order_by
    else payload.order_by = 'menu_order'

    if (typeof has_archives === 'boolean') payload.has_archives = has_archives

    const woo = WooCommerceService.getInstance()

    // Duplicate guard: fetch attributes and compare by name or slug
    try {
      const existing = await (woo as any).executeApiRequest(
        '/wp-json/wc/v3/products/attributes?per_page=100&orderby=name&order=asc',
        'GET'
      )
      const list = Array.isArray(existing) ? existing : []
      const nameLc = name.trim().toLowerCase()
      const slugLc = (payload.slug || '').toLowerCase()
      const dup = list.find(
        (a: any) =>
          (typeof a.name === 'string' && a.name.trim().toLowerCase() === nameLc) ||
          (slugLc && typeof a.slug === 'string' && a.slug.trim().toLowerCase().replace(/^pa[-_]/, '') === slugLc)
      )
      if (dup) {
        return NextResponse.json({ success: false, error: 'Attribute already exists' }, { status: 409 })
      }
    } catch {
      // Ignore pre-check failures; proceed to create
    }

    const created = await (woo as any).executeApiRequest('/wp-json/wc/v3/products/attributes', 'POST', payload)

    return NextResponse.json({ success: true, attribute: created })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to create attribute' }, { status: 500 })
  }
}
