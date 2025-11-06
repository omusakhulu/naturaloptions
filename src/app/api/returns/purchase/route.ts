import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const after = searchParams.get('after')
  const before = searchParams.get('before')

  const where: any = {}

  if (after || before) {
    where.date = {}
    if (after) where.date.gte = new Date(after)
    if (before) where.date.lte = new Date(before)
  }

  const [items, agg] = await Promise.all([
    prisma.purchaseReturn.findMany({ where, orderBy: { date: 'desc' }, include: { vendor: true } }),
    prisma.purchaseReturn.aggregate({ where, _sum: { amount: true } })
  ])

  return NextResponse.json({ items, total: agg._sum.amount || 0 })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { vendorId, amount, date, reason } = body || {}

  if (!vendorId || amount == null || !date) {
    return NextResponse.json({ error: 'vendorId, amount, date are required' }, { status: 400 })
  }

  const item = await prisma.purchaseReturn.create({ data: { vendorId, amount, date: new Date(date), reason } })


return NextResponse.json(item)
}
