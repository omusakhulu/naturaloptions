import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function toNumber(v: any): number {
  if (v == null) return 0
  if (typeof v === 'string') {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : 0
  }
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')

  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)
  const from = fromStr ? new Date(fromStr) : defaultFrom
  const to = toStr ? new Date(toStr) : today

  try {
    const drawers = await prisma.cashDrawer.findMany({
      where: { openedAt: { gte: from } },
      select: {
        id: true,
        openingAmount: true,
        closingAmount: true,
        expectedAmount: true,
        discrepancy: true,
        status: true,
        openedAt: true,
        closedAt: true,
        terminal: { select: { name: true } }
      },
      orderBy: { openedAt: 'desc' }
    })

    const items = drawers.map(d => ({
      id: d.id,
      terminal: d.terminal?.name || '',
      openedAt: (d.openedAt as any as Date).toISOString().slice(0,10),
      closedAt: d.closedAt ? ((d.closedAt as any as Date).toISOString().slice(0,10)) : null,
      openingAmount: toNumber(d.openingAmount),
      closingAmount: toNumber(d.closingAmount),
      expectedAmount: toNumber(d.expectedAmount),
      discrepancy: toNumber(d.discrepancy),
      status: d.status
    }))

    const totals = items.reduce((s, r) => ({ opening: s.opening + r.openingAmount, closing: s.closing + (r.closingAmount || 0), expected: s.expected + (r.expectedAmount || 0), discrepancy: s.discrepancy + (r.discrepancy || 0) }), { opening: 0, closing: 0, expected: 0, discrepancy: 0 })

    return NextResponse.json({ range: { from, to }, items, totals })
  } catch (e) {
    return NextResponse.json({ range: { from, to }, items: [], totals: { opening: 0, closing: 0, expected: 0, discrepancy: 0 } })
  }
}
