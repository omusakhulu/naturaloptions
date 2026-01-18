import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const orderTrackingId = url.searchParams.get('OrderTrackingId')
  const orderMerchantReference = url.searchParams.get('OrderMerchantReference')

  const redirectUrl = new URL('/en/apps/sell/pos', url.origin)
  if (orderTrackingId) redirectUrl.searchParams.set('pesapalOrderTrackingId', orderTrackingId)
  if (orderMerchantReference) redirectUrl.searchParams.set('pesapalMerchantReference', orderMerchantReference)

  return NextResponse.redirect(redirectUrl)
}
