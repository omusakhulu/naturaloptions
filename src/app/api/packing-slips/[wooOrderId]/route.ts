import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { createOrGetPackingSlip, updatePackingSlip } from '@/lib/db/packingSlips'

export async function GET(
  _req: Request,
  context: { params: Promise<{ wooOrderId: string }> }
) {
  const { wooOrderId } = await context.params
  const id = Number(wooOrderId)

  if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    const slip = await prisma.packingSlip.findUnique({ where: { wooOrderId: id } })

    return NextResponse.json({ slip })
  } catch (error) {
    console.error('GET /api/packing-slips/[wooOrderId] error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ wooOrderId: string }> }
) {
  const { wooOrderId } = await context.params
  const id = Number(wooOrderId)

  if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    try {
      const slip = await createOrGetPackingSlip({ wooOrderId: id })

      return NextResponse.json({ success: true, slip })
    } catch (error) {
      console.error('POST /api/packing-slips/[wooOrderId] error:', error)

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  } catch (error) {
    console.error('POST /api/packing-slips/[wooOrderId] error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ wooOrderId: string }> }
) {
  const { wooOrderId } = await context.params
  const id = Number(wooOrderId)

  if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  try {
    const body = await req.json()
    const { status, boothNumber, assignedUserId, notes } = body

    const slip = await updatePackingSlip(id, {
      status,
      boothNumber,
      assignedUserId,
      notes
    })

    return NextResponse.json({ success: true, slip })
  } catch (error) {
    console.error('PATCH /api/packing-slips/[wooOrderId] error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
