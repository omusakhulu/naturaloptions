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
    prisma.expense.findMany({ where, include: { account: true }, orderBy: { date: 'desc' } }),
    prisma.expense.aggregate({ where, _sum: { amount: true } })
  ])

  return NextResponse.json({ items, total: agg._sum.amount || 0 })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { amount, category, accountId, date, note } = body || {}
  if (amount == null || !category || !accountId || !date) {
    return NextResponse.json({ error: 'amount, category, accountId, date are required' }, { status: 400 })
  }
  const item = await prisma.expense.create({ data: { amount, category, accountId, date: new Date(date), note } })
  return NextResponse.json(item)
}
