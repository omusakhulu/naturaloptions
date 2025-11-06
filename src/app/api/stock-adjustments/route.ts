import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function GET() {
  const items = await prisma.stockAdjustmentRecord.findMany({ orderBy: { date: 'desc' } })


return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { reference, location, reason, items = '[]', date } = body || {}

  if (!reference || !date) return NextResponse.json({ error: 'reference and date are required' }, { status: 400 })
  const item = await prisma.stockAdjustmentRecord.create({ data: { reference, location, reason, items, date: new Date(date) } })


return NextResponse.json(item)
}
