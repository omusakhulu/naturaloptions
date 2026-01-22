import { NextResponse } from 'next/server'

import { getPesapalConfigFromEnv, getTransactionStatus } from '@/lib/pesapal/pesapal'

export const runtime = 'nodejs'

function getParam(url: URL, name: string) {
  const v = url.searchParams.get(name)
  return v ? String(v) : ''
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const orderTrackingId = getParam(url, 'OrderTrackingId') || getParam(url, 'orderTrackingId')
  const orderMerchantReference = getParam(url, 'OrderMerchantReference') || getParam(url, 'orderMerchantReference')
  const orderNotificationType = getParam(url, 'OrderNotificationType') || getParam(url, 'orderNotificationType')

  if (!orderTrackingId) {
    return NextResponse.json({ success: false, error: 'Missing OrderTrackingId', status: 200 }, { status: 200 })
  }

  try {
    const cfg = getPesapalConfigFromEnv()
    const details = await getTransactionStatus(cfg, orderTrackingId)

    console.log('📩 Pesapal IPN (GET):', {
      orderNotificationType,
      orderTrackingId,
      orderMerchantReference,
      statusDescription: details?.payment_status_description,
      statusCode: details?.status_code
    })

    return NextResponse.json({
      orderNotificationType: orderNotificationType || 'IPNCHANGE',
      orderTrackingId,
      orderMerchantReference,
      status: 200
    })
  } catch (err: any) {
    console.error('Pesapal IPN error:', err?.message || err)

    return NextResponse.json({
      orderNotificationType: orderNotificationType || 'IPNCHANGE',
      orderTrackingId,
      orderMerchantReference,
      status: 500
    })
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const body = await req.json().catch(() => ({}))

    const orderTrackingId = String(body?.OrderTrackingId || body?.orderTrackingId || getParam(url, 'OrderTrackingId') || '').trim()
    const orderMerchantReference = String(body?.OrderMerchantReference || body?.orderMerchantReference || getParam(url, 'OrderMerchantReference') || '').trim()
    const orderNotificationType = String(body?.OrderNotificationType || body?.orderNotificationType || getParam(url, 'OrderNotificationType') || 'IPNCHANGE')

    if (!orderTrackingId) {
      return NextResponse.json({ success: false, error: 'Missing OrderTrackingId', status: 200 }, { status: 200 })
    }

    const cfg = getPesapalConfigFromEnv()
    const details = await getTransactionStatus(cfg, orderTrackingId)

    console.log('📩 Pesapal IPN (POST):', {
      orderNotificationType,
      orderTrackingId,
      orderMerchantReference,
      statusDescription: details?.payment_status_description,
      statusCode: details?.status_code
    })

    return NextResponse.json({
      orderNotificationType,
      orderTrackingId,
      orderMerchantReference,
      status: 200
    })
  } catch (err: any) {
    console.error('Pesapal IPN error:', err?.message || err)

    return NextResponse.json({
      status: 500
    })
  }
}
