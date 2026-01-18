import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getToken } from 'next-auth/jwt'

import prisma from '@/lib/prisma'
import { authOptions } from '@/config/auth'

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    })
  ])
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const sessionUserId = (session.user as any)?.id
  const sessionRole = (session.user as any)?.role

  if (sessionRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  let token: any = null
  let tokenError: string | null = null

  try {
    token = await withTimeout(getToken({ req: request, secret: process.env.NEXTAUTH_SECRET }), 2500, 'getToken')
  } catch (error) {
    tokenError = error instanceof Error ? error.message : 'Failed to decode token'
  }

  const tokenUserId = (token as any)?.id || token?.sub || null
  const tokenRole = (token as any)?.role || null

  let dbUser: any = null
  let dbUserError: string | null = null

  const lookupUserId = tokenUserId || sessionUserId || null

  if (lookupUserId) {
    try {
      dbUser = await withTimeout(
        prisma.user.findUnique({
          where: { id: String(lookupUserId) },
          select: { id: true, email: true, role: true, active: true, updatedAt: true }
        }),
        2500,
        'prisma.user.findUnique'
      )
    } catch (error) {
      dbUserError = error instanceof Error ? error.message : 'Failed to load db user'
    }
  }

  return NextResponse.json({
    success: true,
    session: {
      user: {
        id: sessionUserId || null,
        email: session.user?.email || null,
        role: sessionRole || null
      },
      expires: (session as any)?.expires || null
    },
    token: {
      id: tokenUserId,
      role: tokenRole,
      sub: token?.sub || null,
      email: (token as any)?.email || null,
      name: (token as any)?.name || null,
      iat: (token as any)?.iat || null,
      exp: (token as any)?.exp || null
    },
    tokenError,
    dbUser,
    dbUserError
  })
}
