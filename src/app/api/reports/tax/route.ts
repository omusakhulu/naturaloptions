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

function normalizeDate(d: any): string {
  const dt = new Date(d)
  return dt.toISOString().slice(0, 10)
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
    const orders = await prisma.order.findMany({
      where: { dateCreated: { gte: from, lte: to } },
      select: { dateCreated: true, taxTotal: true }
    })

    const salesTaxByDay: Record<string, number> = {}
    let salesTaxTotal = 0

    for (const o of orders) {
      const d = normalizeDate(o.dateCreated as any)
      const tax = toNumber((o as any).taxTotal)
      salesTaxByDay[d] = (salesTaxByDay[d] || 0) + tax
      salesTaxTotal += tax
    }

    const inputTaxTotal = 0 // No explicit bill tax field found; can extend when available
    const netTax = salesTaxTotal - inputTaxTotal
    const series = Object.keys(salesTaxByDay).sort().map(d => ({ date: d, salesTax: salesTaxByDay[d] }))

    return NextResponse.json({
      range: { from, to },
      salesTaxTotal,
      inputTaxTotal,
      netTax,
      series
    })
  } catch (e) {
    return NextResponse.json({ range: { from, to }, salesTaxTotal: 0, inputTaxTotal: 0, netTax: 0, series: [] })
  }
}
