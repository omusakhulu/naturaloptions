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
  const warehouseId = searchParams.get('warehouseId')
  const locationId = searchParams.get('locationId')
  const sku = searchParams.get('sku') || ''
  const q = searchParams.get('q') || ''

  try {
    const where: any = {}
    if (warehouseId) {
      where.warehouseId = warehouseId
    } else if (locationId) {
      // Map store/branch (Location) to its warehouses
      const warehouses = await prisma.warehouse.findMany({ where: { locationId }, select: { id: true } })
      const ids = warehouses.map(w => w.id)
      if (ids.length === 0) {
        return NextResponse.json({ items: [], totals: { quantity: 0, value: 0 } })
      }
      where.warehouseId = { in: ids }
    }
    if (sku) where.sku = { contains: sku, mode: 'insensitive' }
    if (q) {
      where.OR = [
        { productName: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } }
      ]
    }

    const rows = await prisma.inventoryItem.findMany({
      where,
      select: {
        sku: true,
        productName: true,
        quantity: true,
        costPrice: true,
        sellingPrice: true,
        warehouseId: true
      }
    })

    const bySku = new Map<string, { sku: string; productName: string; quantity: number; value: number; avgCost: number; sellingPrice: number | null }>()

    for (const r of rows) {
      const key = r.sku || r.productName || 'UNKNOWN'
      const prev = bySku.get(key) || { sku: r.sku || '', productName: r.productName || '', quantity: 0, value: 0, avgCost: 0, sellingPrice: r.sellingPrice as any }
      const qty = toNumber(r.quantity)
      const cost = toNumber(r.costPrice)
      prev.quantity += qty
      prev.value += qty * cost
      if (!prev.sellingPrice && r.sellingPrice != null) prev.sellingPrice = toNumber(r.sellingPrice)
      bySku.set(key, prev)
    }

    const items = Array.from(bySku.values()).map(it => ({
      ...it,
      avgCost: it.quantity > 0 ? it.value / it.quantity : 0
    }))

    items.sort((a, b) => (a.productName || '').localeCompare(b.productName || ''))

    const totals = items.reduce((s, it) => ({ quantity: s.quantity + toNumber(it.quantity), value: s.value + toNumber(it.value) }), { quantity: 0, value: 0 })

    return NextResponse.json({ items, totals })
  } catch (e) {
    return NextResponse.json({ items: [], totals: { quantity: 0, value: 0 } })
  }
}
