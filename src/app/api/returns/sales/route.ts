import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/config/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
    prisma.salesReturn.findMany({ where, orderBy: { date: 'desc' } }),
    prisma.salesReturn.aggregate({ where, _sum: { amount: true } })
  ])

  return NextResponse.json({ items, total: agg._sum.amount || 0 })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { orderId, amount, date, reason } = body || {}

  if (!orderId || amount == null || !date) {
    return NextResponse.json({ error: 'orderId, amount, date are required' }, { status: 400 })
  }

  const item = await prisma.salesReturn.create({ data: { orderId, amount, date: new Date(date), reason } })


return NextResponse.json(item)
}
