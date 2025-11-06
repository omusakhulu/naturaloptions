import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')

  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)
  const from = fromStr ? new Date(fromStr) : defaultFrom
  const to = toStr ? new Date(toStr) : today

  try {
    const items = await prisma.stockAdjustmentRecord.findMany({
      where: { date: { gte: from, lte: to } },
      select: { id: true, date: true, reason: true, items: true },
      orderBy: { date: 'desc' }
    })
    const rows = items.map(i => ({ id: i.id, date: (i.date as any as Date).toISOString().slice(0,10), reason: i.reason || '', itemsJson: i.items }))
    return NextResponse.json({ range: { from, to }, items: rows })
  } catch (e) {
    return NextResponse.json({ range: { from, to }, items: [] })
  }
}
