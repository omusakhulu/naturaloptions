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

function safeParse(jsonStr: any): any[] {
  if (!jsonStr) return []
  try {
    if (typeof jsonStr === 'string') return JSON.parse(jsonStr)
    if (Array.isArray(jsonStr)) return jsonStr
    return []
  } catch {
    return []
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')
  const q = (searchParams.get('q') || '').toLowerCase()

  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)
  const from = fromStr ? new Date(fromStr) : defaultFrom
  const to = toStr ? new Date(toStr) : today

  try {
    const invoices = await prisma.invoice.findMany({
      where: { date: { gte: from, lte: to } },
      select: { lineItems: true, date: true }
    })

    const bySku = new Map<string, { sku: string; name: string; quantity: number; amount: number }>()

    for (const inv of invoices) {
      const items = safeParse((inv as any).lineItems)
      for (const li of items) {
        const sku = String(li?.sku || '').trim() || String(li?.product_id || '')
        const name = String(li?.name || 'Item')
        const qty = toNumber(li?.quantity)
        const total = toNumber(li?.total)
        const key = sku || name
        const prev = bySku.get(key) || { sku, name, quantity: 0, amount: 0 }
        prev.quantity += qty
        prev.amount += total
        bySku.set(key, prev)
      }
    }

    let items = Array.from(bySku.values())

    if (q) {
      items = items.filter(it => (it.sku || '').toLowerCase().includes(q) || (it.name || '').toLowerCase().includes(q))
    }

    items.sort((a, b) => b.quantity - a.quantity)

    const totals = items.reduce((s, it) => ({ quantity: s.quantity + toNumber(it.quantity), amount: s.amount + toNumber(it.amount) }), { quantity: 0, amount: 0 })

    return NextResponse.json({ range: { from, to }, items, totals })
  } catch (e) {
    return NextResponse.json({ range: { from, to }, items: [], totals: { quantity: 0, amount: 0 } })
  }
}
