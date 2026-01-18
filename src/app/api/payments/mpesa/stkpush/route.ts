import { NextResponse } from 'next/server'

import { getDarajaConfigFromEnv, stkPush } from '@/lib/mpesa/daraja'

export const runtime = 'nodejs'

function normalizeKenyanPhone(input: string) {
  const digits = String(input || '').replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`
  if (digits.startsWith('254') && digits.length === 12) return digits
  if (digits.startsWith('7') && digits.length === 9) return `254${digits}`

  return digits
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const phone = normalizeKenyanPhone(body?.phone)
    const amount = Number(body?.amount)
    const accountReference = String(body?.accountReference || '').trim() || `POS-${Date.now()}`
    const transactionDesc = String(body?.transactionDesc || '').trim() || 'POS Payment'

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 })
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be > 0' }, { status: 400 })
    }

    const cfg = getDarajaConfigFromEnv()
    const resp = await stkPush(cfg, {
      phone,
      amount,
      accountReference,
      transactionDesc
    })

    return NextResponse.json({ success: true, phone, amount, ...resp })
  } catch (error: any) {
    console.error('M-PESA stkpush error:', error?.message || error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send M-PESA prompt',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
