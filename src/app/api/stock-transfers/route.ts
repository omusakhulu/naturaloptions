import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function GET() {
  const items = await prisma.stockTransferRecord.findMany({ orderBy: { date: 'desc' } })


return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { reference, from, to, status = 'Draft', date, notes } = body || {}

  if (!reference || !date) return NextResponse.json({ error: 'reference and date are required' }, { status: 400 })
  const item = await prisma.stockTransferRecord.create({ data: { reference, from, to, status, date: new Date(date), notes } })


return NextResponse.json(item)
}
