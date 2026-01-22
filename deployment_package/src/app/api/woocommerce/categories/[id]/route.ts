import { NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const idNum = Number(resolvedParams.id)

    if (!idNum || Number.isNaN(idNum)) {
      return NextResponse.json({ success: false, error: 'Invalid category id' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({} as any))
    const payload: any = {}

    if (typeof body.name === 'string') payload.name = body.name
    if (typeof body.description === 'string') payload.description = body.description
    if (Number.isInteger(body.parent)) payload.parent = body.parent
    if (body.image && typeof body.image === 'object') payload.image = body.image

    const woo = WooCommerceService.getInstance()
    const updated = await (woo as any).executeApiRequest(
      `/wp-json/wc/v3/products/categories/${idNum}`,
      'PUT',
      payload
    )

    return NextResponse.json({ success: true, category: updated })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update category' },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const idNum = Number(resolvedParams.id)

    if (!idNum || Number.isNaN(idNum)) {
      return NextResponse.json({ success: false, error: 'Invalid category id' }, { status: 400 })
    }

    const woo = WooCommerceService.getInstance()
    const result = await (woo as any).executeApiRequest(
      `/wp-json/wc/v3/products/categories/${idNum}?force=true`,
      'DELETE'
    )

    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete category' },
      { status: 500 }
    )
  }
}
