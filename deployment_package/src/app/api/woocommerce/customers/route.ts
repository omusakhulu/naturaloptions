import { NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    const woo = WooCommerceService.getInstance()
    const created = await (woo as any).executeApiRequest('/wp-json/wc/v3/customers', 'POST', body)

    return NextResponse.json({ success: true, customer: created })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to create customer' }, { status: 500 })
  }
}
