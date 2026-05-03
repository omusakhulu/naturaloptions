import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const isActiveParam = searchParams.get('isActive')

  const where: Record<string, unknown> = {}

  if (isActiveParam != null) where.isActive = isActiveParam === 'true'

  try {
    const items = await prisma.location.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        phone: true,
        isActive: true,
        isMainLocation: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { inventoryItems: true } }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ items: [] })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, address, city, state, zipCode, phone, isActive, isMainLocation } = body || {}

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 })
    }

    const location = await prisma.location.create({
      data: {
        name: name.trim(),
        ...(address !== undefined ? { address } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(state !== undefined ? { state } : {}),
        ...(zipCode !== undefined ? { zipCode } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(isMainLocation !== undefined ? { isMainLocation } : {})
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        phone: true,
        isActive: true,
        isMainLocation: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { inventoryItems: true } }
      }
    })

    return NextResponse.json({ success: true, location }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal server error'

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
