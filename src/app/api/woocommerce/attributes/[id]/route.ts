import { NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const idNum = Number(resolvedParams.id)

    if (!idNum || Number.isNaN(idNum)) {
      return NextResponse.json({ success: false, error: 'Invalid attribute id' }, { status: 400 })
    }

    const woo = WooCommerceService.getInstance()
    const result = await (woo as any).executeApiRequest(
      `/wp-json/wc/v3/products/attributes/${idNum}?force=true`,
      'DELETE'
    )

    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to delete attribute' }, { status: 500 })
  }
}
