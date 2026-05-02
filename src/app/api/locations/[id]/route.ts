import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

const locationSelect = {
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
} as const

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const location = await prisma.location.findUnique({
      where: { id },
      select: locationSelect
    })

    if (!location) {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, location })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal server error'

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, address, city, state, zipCode, phone, isActive, isMainLocation } = body || {}

    const location = await prisma.location.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(state !== undefined ? { state } : {}),
        ...(zipCode !== undefined ? { zipCode } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(isMainLocation !== undefined ? { isMainLocation } : {})
      },
      select: locationSelect
    })

    return NextResponse.json({ success: true, location })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal server error'

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const location = await prisma.location.findUnique({
      where: { id },
      select: { _count: { select: { inventoryItems: true } } }
    })

    if (!location) {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 })
    }

    if (location._count.inventoryItems > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete location with existing inventory. Remove or transfer inventory first.'
        },
        { status: 400 }
      )
    }

    await prisma.location.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal server error'

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
