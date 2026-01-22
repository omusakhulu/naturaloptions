import { NextResponse } from 'next/server'

import { getPesapalConfigFromEnv, getTransactionStatus } from '@/lib/pesapal/pesapal'

export const runtime = 'nodejs'

function normalizeStatus(desc: string) {
  const d = String(desc || '').toLowerCase()
  if (d.includes('completed') || d.includes('success')) return 'COMPLETED'
  if (d.includes('failed') || d.includes('invalid') || d.includes('rejected')) return 'FAILED'
  return 'PENDING'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const orderTrackingId = String(body?.orderTrackingId || body?.order_tracking_id || '').trim()

    if (!orderTrackingId) {
      return NextResponse.json({ success: false, error: 'Missing orderTrackingId' }, { status: 400 })
    }

    const cfg = getPesapalConfigFromEnv()
    const details = await getTransactionStatus(cfg, orderTrackingId)

    const statusDescription = String(details?.payment_status_description || '')
    const status = normalizeStatus(statusDescription)

    return NextResponse.json({
      success: true,
      status,
      statusDescription,
      orderTrackingId,
      merchantReference: details?.merchant_reference || null,
      confirmationCode: details?.confirmation_code || null,
      paymentMethod: details?.payment_method || null,
      amount: details?.amount || null,
      currency: details?.currency || null,
      raw: details
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || String(error)
      },
      { status: 500 }
    )
  }
}
