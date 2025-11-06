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

function dateOnly(d: Date) {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  let after = searchParams.get('after')
  let before = searchParams.get('before')

  // Default to last 30 days
  if (!after || !before) {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 29)
    after = after || dateOnly(start)
    before = before || dateOnly(end)
  }

  try {
    const whereInv: any = {
      invoiceStatus: 'paid'
    }
    const whereExp: any = {}

    if (after || before) {
      if (after || before) {
        if (after) {
          const dt = new Date(after)
          whereInv.date = { ...(whereInv.date || {}), gte: dt }
          whereExp.date = { ...(whereExp.date || {}), gte: dt }
        }
        if (before) {
          const dt = new Date(before)
          whereInv.date = { ...(whereInv.date || {}), lte: dt }
          whereExp.date = { ...(whereExp.date || {}), lte: dt }
        }
      }
    }

    const [invoices, expenses, accounts] = await Promise.all([
      prisma.invoice.findMany({ where: whereInv, select: { amount: true, date: true } }),
      prisma.expense.findMany({ where: whereExp, select: { amount: true, date: true, category: true } }),
      prisma.paymentAccount.findMany({ select: { balance: true } })
    ])

    const cashOnHand = accounts.reduce((s, a) => s + toNumber(a.balance), 0)

    // Build daily series
    const map: Record<string, { inflow: number; outflow: number }> = {}
    const start = new Date(after!)
    const end = new Date(before!)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      map[dateOnly(d)] = { inflow: 0, outflow: 0 }
    }

    for (const inv of invoices) {
      const key = dateOnly(new Date(inv.date as any))
      if (!map[key]) map[key] = { inflow: 0, outflow: 0 }
      map[key].inflow += toNumber(inv.amount)
    }

    for (const exp of expenses) {
      const key = dateOnly(new Date(exp.date as any))
      if (!map[key]) map[key] = { inflow: 0, outflow: 0 }
      map[key].outflow += toNumber(exp.amount)
    }

    const days = Object.keys(map).sort()
    const series = days.map(d => ({ date: d, inflow: map[d].inflow, outflow: map[d].outflow, net: map[d].inflow - map[d].outflow }))
    const totals = series.reduce((s, r) => ({ inflow: s.inflow + r.inflow, outflow: s.outflow + r.outflow, net: s.net + r.net }), { inflow: 0, outflow: 0, net: 0 })

    // Cumulative line for net
    let running = 0
    const cumulative = series.map(r => { running += r.net; return { date: r.date, value: running } })

    return NextResponse.json({ range: { after, before }, totals, cashOnHand, series, cumulative })
  } catch (e) {
    return NextResponse.json({ range: { after, before }, totals: { inflow: 0, outflow: 0, net: 0 }, cashOnHand: 0, series: [], cumulative: [] })
  }
}
