import { NextResponse } from 'next/server'

import { getPesapalConfigFromEnv, submitOrder } from '@/lib/pesapal/pesapal'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const amount = typeof body?.amount === 'number' ? body.amount : parseFloat(String(body?.amount || '0'))
    const currency = String(body?.currency || 'KES')
    const description = String(body?.description || 'POS payment')
    const branch = body?.branch ? String(body.branch) : undefined

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
    }

    const customer = body?.customer || null

    const nameFromCustomer = customer?.name || customer?.fullName || customer?.full_name
    const nameParts = typeof nameFromCustomer === 'string' ? nameFromCustomer.trim().split(/\s+/).filter(Boolean) : []

    const firstName = (customer?.firstName || customer?.first_name || (nameParts[0] || '')).trim()
    const lastName = (customer?.lastName || customer?.last_name || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '')).trim()
    const email = String(customer?.email || '').trim()
    const phone = String(customer?.phone || customer?.phone_number || '').trim()

    const isPesapalMethod = String(body?.method || body?.paymentMethod || '').toLowerCase() === 'pesapal'
    const isCardOrBank = ['card', 'bank'].includes(String(body?.method || body?.paymentMethod || '').toLowerCase())

    // Pesapal requires billing details in the submit order request.
    // If the POS has no linked customer, fail fast with a clear 400 so the UI can prompt for details.
    if (!customer || !email || !phone || !firstName || !lastName) {
      const missing: string[] = []
      if (!customer) missing.push('customer')
      if (!firstName) missing.push('customer.firstName')
      if (!lastName) missing.push('customer.lastName')
      if (!email) missing.push('customer.email')
      if (!phone) missing.push('customer.phone')

      // Only block the request if this is used for card/bank checkout (Pesapal flow).
      if (isPesapalMethod || isCardOrBank) {
        return NextResponse.json(
          {
            success: false,
            error: 'Pesapal requires customer billing details (first name, last name, email, phone). Please link/select a customer or provide these details.',
            missing
          },
          { status: 400 }
        )
      }
    }

    const cfg = getPesapalConfigFromEnv()

    const id = `POS-${Date.now()}`

    const res = await submitOrder(cfg, {
      id,
      currency,
      amount,
      description,
      branch,
      billing_address: customer ? {
        email_address: email || undefined,
        phone_number: phone || undefined,
        country_code: customer?.country_code || customer?.countryCode || 'KE',
        first_name: firstName || undefined,
        middle_name: customer?.middleName || customer?.middle_name || undefined,
        last_name: lastName || undefined,
        line_1: customer?.address || customer?.line_1 || undefined,
        line_2: customer?.line_2 || undefined,
        city: customer?.city || undefined,
        state: customer?.state || undefined,
        postal_code: customer?.postal_code || undefined,
        zip_code: customer?.zip_code || undefined
      } : undefined
    })

    if (!res.order_tracking_id || !res.redirect_url) {
      return NextResponse.json({ success: false, error: 'Pesapal did not return order_tracking_id/redirect_url', details: res }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      orderTrackingId: res.order_tracking_id,
      merchantReference: res.merchant_reference,
      redirectUrl: res.redirect_url
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
