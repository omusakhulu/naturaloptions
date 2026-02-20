import { NextRequest, NextResponse } from 'next/server'

import NextAuth from 'next-auth'

import { authOptions } from '@/config/auth'
import { rateLimit } from '@/lib/rate-limiter'

const handler = NextAuth(authOptions)

// Rate limit login attempts: 5 per minute per IP
async function rateLimitedPOST(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { limited, resetIn } = rateLimit('auth', ip, { maxRequests: 5, windowMs: 60_000 })

  if (limited) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(resetIn / 1000)) }
      }
    )
  }

  return handler(req as any, context as any)
}

export { handler as GET, rateLimitedPOST as POST }
