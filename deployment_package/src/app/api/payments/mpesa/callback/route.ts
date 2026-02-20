import { NextResponse } from 'next/server'

import logger from '@/lib/logger'

export const runtime = 'nodejs'

// Basic in-memory rate limiting (30 req/min per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60_000 })

    return false
  }

  entry.count++

  return entry.count > 30
}

interface MpesaCallbackBody {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string
      CheckoutRequestID?: string
      ResultCode?: number
      ResultDesc?: string
      CallbackMetadata?: {
        Item?: Array<{ Name: string; Value: string | number }>
      }
    }
  }
}

function isValidMpesaCallback(body: unknown): body is MpesaCallbackBody {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>

  if (!b.Body || typeof b.Body !== 'object') return false
  const stkCallback = (b.Body as Record<string, unknown>).stkCallback

  if (!stkCallback || typeof stkCallback !== 'object') return false
  const cb = stkCallback as Record<string, unknown>

  return typeof cb.ResultCode === 'number' && typeof cb.CheckoutRequestID === 'string'
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const body = await req.json()

    if (!isValidMpesaCallback(body)) {
      logger.warn('M-Pesa callback: invalid payload structure', { ip })

      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid payload' }, { status: 400 })
    }

    const { stkCallback } = body.Body!
    const { ResultCode, CheckoutRequestID, MerchantRequestID, ResultDesc } = stkCallback!

    // Log only non-sensitive metadata
    logger.info('M-Pesa callback received', {
      checkoutRequestId: CheckoutRequestID,
      merchantRequestId: MerchantRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc
    })

    if (ResultCode === 0) {
      // Payment successful — process here
      // TODO: Update order/payment status in database
      logger.info('M-Pesa payment successful', { checkoutRequestId: CheckoutRequestID })
    } else {
      // Payment failed or cancelled
      logger.warn('M-Pesa payment failed', {
        checkoutRequestId: CheckoutRequestID,
        resultCode: ResultCode,
        resultDesc: ResultDesc
      })
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    logger.error('M-Pesa callback processing error', { error: message, ip })

    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Processing error' }, { status: 500 })
  }
}
