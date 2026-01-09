import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { amount, category, accountId, date, note } = body || {}
  const item = await prisma.expense.update({
    where: { id },
    data: {
      ...(amount != null ? { amount } : {}),
      ...(category ? { category } : {}),
      ...(accountId ? { accountId } : {}),
      ...(date ? { date: new Date(date) } : {}),
      ...(note !== undefined ? { note } : {})
    }
  })
  return NextResponse.json(item)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.expense.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
