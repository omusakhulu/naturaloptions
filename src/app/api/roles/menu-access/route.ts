import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/config/auth'
import { getRoleMenuAccessMap, setRoleMenuAccessMap } from '@/lib/roleMenuAccess'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const map = await getRoleMenuAccessMap()

  return NextResponse.json({ success: true, map })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const role = (session.user as any)?.role

  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))

  if (!body || typeof body !== 'object' || !body.map || typeof body.map !== 'object') {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
  }

  await setRoleMenuAccessMap(body.map)

  return NextResponse.json({ success: true })
}
