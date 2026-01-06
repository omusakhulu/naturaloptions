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

function ymd(d: Date): string {
  const dt = new Date(d)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')
  const locationId = searchParams.get('locationId')

  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)
  const from = fromStr ? new Date(fromStr) : defaultFrom
  const to = toStr ? new Date(toStr) : today

  try {
    // 1. Fetch POS Sales Tax
    const posWhere: any = { 
      saleDate: { gte: from, lte: to },
      status: 'COMPLETED'
    }
    if (locationId) {
      posWhere.terminal = { locationId }
    }

    const posSales = await prisma.pOSSale.findMany({
      where: posWhere,
      select: { saleDate: true, subtotal: true, taxAmount: true }
    })

    // 2. Fetch WooCommerce Orders Tax (assuming synced to Order model)
    const wooOrders = await prisma.order.findMany({
      where: {
        dateCreated: { gte: from, lte: to },
        status: { in: ['completed', 'processing'] }
      },
      select: { dateCreated: true, subtotal: true, taxTotal: true }
    })

    const byDay: Record<string, { taxableBase: number; salesTax: number }> = {}

    for (const s of posSales) {
      const key = ymd(s.saleDate)
      if (!byDay[key]) byDay[key] = { taxableBase: 0, salesTax: 0 }
      byDay[key].taxableBase += toNumber(s.subtotal)
      byDay[key].salesTax += toNumber(s.taxAmount)
    }

    for (const o of wooOrders) {
      if (o.dateCreated) {
        const key = ymd(o.dateCreated)
        if (!byDay[key]) byDay[key] = { taxableBase: 0, salesTax: 0 }
        byDay[key].taxableBase += toNumber(o.subtotal)
        byDay[key].salesTax += toNumber(o.taxTotal)
      }
    }

    const byPeriod = Object.keys(byDay).sort().map(date => ({
      date,
      ...byDay[date]
    }))

    const totals = byPeriod.reduce((s, r) => ({
      taxableBase: s.taxableBase + r.taxableBase,
      salesTax: s.salesTax + r.salesTax
    }), { taxableBase: 0, salesTax: 0 })

    return NextResponse.json({
      range: { from: ymd(from), to: ymd(to) },
      locationId: locationId || null,
      totals,
      byPeriod
    })
  } catch (e: any) {
    console.error('Tax Report API Error:', e)
    return NextResponse.json({
      range: { from: ymd(from), to: ymd(to) },
      locationId: null,
      totals: { taxableBase: 0, salesTax: 0 },
      byPeriod: []
    })
  }
}
