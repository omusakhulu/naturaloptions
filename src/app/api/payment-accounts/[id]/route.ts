import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const body = await request.json()
  const { name, type, balance, status } = body || {}

  const item = await prisma.paymentAccount.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(type ? { type } : {}),
      ...(balance != null ? { balance } : {}),
      ...(status ? { status } : {})
    }
  })


return NextResponse.json(item)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  await prisma.paymentAccount.delete({ where: { id } })

return NextResponse.json({ success: true })
}
