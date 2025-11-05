import { NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const customerId = Number(body?.customerId)
    const newPassword = String(body?.newPassword || '').trim()

    if (!customerId || !newPassword) {
      return NextResponse.json({ ok: false, error: 'customerId and newPassword are required' }, { status: 400 })
    }

    const woo = WooCommerceService.getInstance()

    try {
      const resp = await woo.updateCustomer(customerId, { password: newPassword })

      return NextResponse.json({ ok: true, result: resp })
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : 'WooCommerce update failed'

      return NextResponse.json({ ok: false, error: msg }, { status: 500 })
    }
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Failed to update password'

    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
