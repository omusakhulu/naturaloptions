import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

const hasDb = !!process.env.DATABASE_URL
let memItems: any[] = []

export async function GET() {
  if (hasDb) {
    try {
      const items = await prisma.stockTransferRecord.findMany({ orderBy: { date: 'desc' } })
      return NextResponse.json({ items })
    } catch (e: any) {}
  }
  const items = [...memItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { reference, from, to, status = 'Draft', date, notes } = body || {}

  if (!reference || !date) return NextResponse.json({ error: 'reference and date are required' }, { status: 400 })
  if (hasDb) {
    try {
      const item = await prisma.stockTransferRecord.create({ data: { reference, from, to, status, date: new Date(date), notes } })
      return NextResponse.json(item)
    } catch (e: any) {}
  }
  const item = { id: String(Date.now()), reference, from, to, status, date, notes }
  memItems.unshift(item)
  return NextResponse.json(item)
}
