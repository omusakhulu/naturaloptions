import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { reference, location, reason, items, date } = body || {}

  const item = await prisma.stockAdjustmentRecord.update({
    where: { id },
    data: {
      ...(reference ? { reference } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(reason !== undefined ? { reason } : {}),
      ...(items !== undefined ? { items } : {}),
      ...(date ? { date: new Date(date) } : {})
    }
  })

return NextResponse.json(item)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  await prisma.stockAdjustmentRecord.delete({ where: { id } })

return NextResponse.json({ success: true })
}
