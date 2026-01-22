import { NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function GET() {
  try {
    const woo = WooCommerceService.getInstance()
    const categories = await woo.getCategories()

    return NextResponse.json({ success: true, categories })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { name, description, parent, image } = body || {}

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }

    const woo = WooCommerceService.getInstance()

    const payload: any = { name }
    if (typeof description === 'string') payload.description = description
    if (Number.isInteger(parent)) payload.parent = parent
    if (image && typeof image === 'object') payload.image = image

    // Use the generic executor to create a category
    const created = await (woo as any).executeApiRequest(
      '/wp-json/wc/v3/products/categories',
      'POST',
      payload
    )

    return NextResponse.json({ success: true, category: created })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to create category' }, { status: 500 })
  }
}
