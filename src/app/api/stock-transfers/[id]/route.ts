import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { reference, from, to, status, date, notes } = body || {}

  const item = await prisma.stockTransferRecord.update({
    where: { id },
    data: {
      ...(reference ? { reference } : {}),
      ...(from !== undefined ? { from } : {}),
      ...(to !== undefined ? { to } : {}),
      ...(status ? { status } : {}),
      ...(date ? { date: new Date(date) } : {}),
      ...(notes !== undefined ? { notes } : {})
    }
  })


return NextResponse.json(item)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  await prisma.stockTransferRecord.delete({ where: { id } })

return NextResponse.json({ success: true })
}
