import { NextRequest, NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const productId = Number(id)

    if (!productId || Number.isNaN(productId)) {
      return NextResponse.json({ success: false, error: 'Invalid product id' }, { status: 400 })
    }

    const woo = WooCommerceService.getInstance()
    const variations = await woo.listVariations(productId)

    return NextResponse.json({ success: true, variations })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to load variations' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const productId = Number(id)

    if (!productId || Number.isNaN(productId)) {
      return NextResponse.json({ success: false, error: 'Invalid product id' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const input = (body?.variations || []) as Array<any>

    if (!Array.isArray(input) || input.length === 0) {
      return NextResponse.json({ success: false, error: 'No variations provided' }, { status: 400 })
    }

    const woo = WooCommerceService.getInstance()

    const results = [] as any[]

    for (const v of input) {
      // Normalize attributes to required WooCommerce shape
      const attrs = Array.isArray(v.attributes)
        ? v.attributes
            .filter((a: any) => a && (a.id || a.name) && (a.option !== undefined && a.option !== null))
            .map((a: any) => ({ id: Number(a.id) || undefined, name: a.name, option: String(a.option) }))
        : []

      const payload: any = {
        sku: v.sku || undefined,
        regular_price: v.regular_price != null ? String(v.regular_price) : undefined,
        sale_price: v.sale_price != null && String(v.sale_price) !== '' ? String(v.sale_price) : undefined,
        manage_stock: typeof v.manage_stock === 'boolean' ? v.manage_stock : undefined,
        stock_quantity:
          v.stock_quantity != null && String(v.stock_quantity) !== '' ? Number(v.stock_quantity) : undefined,
        stock_status: v.stock_status || undefined,
        image: v.image || undefined,
        attributes: attrs
      }

      // Remove undefined keys to avoid API errors
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])

      const updated = await woo.upsertVariation(productId, { id: v.id ? Number(v.id) : undefined, ...payload })
      results.push(updated)
    }

    return NextResponse.json({ success: true, variations: results })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to upsert variations' },
      { status: 500 }
    )
  }
}
