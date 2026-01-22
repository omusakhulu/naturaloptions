import { NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function GET() {
  try {
    const woo = WooCommerceService.getInstance()
    const tags = await woo.getTags()

    return NextResponse.json({ success: true, tags })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch tags' }, { status: 500 })
  }
}
