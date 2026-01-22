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
    const rows = await prisma.expense.findMany({
      where: { date: { gte: from, lte: to } },
      select: { amount: true, category: true, account: { select: { name: true } } },
      orderBy: { date: 'desc' }
    })

    const map = new Map<string, number>()
    for (const r of rows) {
      const key = `${r.category}||${r.account?.name || '-'}`
      map.set(key, (map.get(key) || 0) + toNumber(r.amount))
    }
    const items = Array.from(map.entries()).map(([k, v]) => { const [category, account] = k.split('||'); return { category, account, amount: v } })
    const totals = { amount: items.reduce((s, r) => s + r.amount, 0) }

    return NextResponse.json({ range: { from, to }, items, totals })
  } catch (e) {
    return NextResponse.json({ range: { from, to }, items: [], totals: { amount: 0 } })
  }
}
