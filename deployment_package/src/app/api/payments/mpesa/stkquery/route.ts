import { NextResponse } from 'next/server'

import { getDarajaConfigFromEnv, stkQuery } from '@/lib/mpesa/daraja'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const checkoutRequestId = String(body?.checkoutRequestId || '').trim()

    if (!checkoutRequestId) {
      return NextResponse.json({ success: false, error: 'checkoutRequestId is required' }, { status: 400 })
    }

    const cfg = getDarajaConfigFromEnv()
    const resp = await stkQuery(cfg, checkoutRequestId)

    const resultCode = resp?.ResultCode != null ? String(resp.ResultCode) : null

    return NextResponse.json({
      success: true,
      resultCode,
      isSuccess: resultCode === '0',
      ...resp
    })
  } catch (error: any) {
    console.error('M-PESA stkquery error:', error?.message || error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to query M-PESA prompt status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
