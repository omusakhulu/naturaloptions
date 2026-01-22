import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/config/auth'
import { prisma } from '@/lib/prisma'

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
  const locationId = searchParams.get('locationId')

  const today = new Date()
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)

  const from = fromStr ? new Date(fromStr) : defaultFrom
  const toBase = toStr ? new Date(toStr) : today
  const to = new Date(toBase)
  to.setHours(23, 59, 59, 999)

  const fromOut = fromStr || defaultFrom.toISOString().slice(0, 10)
  const toOut = toStr || today.toISOString().slice(0, 10)

  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let warehouseIds: string[] | null = null
    if (locationId) {
      const warehouses = await prisma.warehouse.findMany({
        where: { locationId },
        select: { id: true }
      })
      warehouseIds = warehouses.map(w => w.id)
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        orderDate: { gte: from, lte: to },
        ...(warehouseIds ? { warehouseId: { in: warehouseIds } } : {})
      },
      select: { id: true }
    })

    if (purchaseOrders.length === 0) {
      return NextResponse.json({
        range: { from: fromOut, to: toOut },
        locationId,
        items: [],
        totals: { quantity: 0, totalCost: 0 }
      })
    }

    const poIds = purchaseOrders.map(po => po.id)
    const poItems = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: { in: poIds } },
      select: {
        sku: true,
        productName: true,
        quantity: true,
        totalPrice: true
      }
    })

    const byProduct = new Map<string, { productId: string; productName: string; quantity: number; totalCost: number }>()
    for (const li of poItems) {
      const key = li.sku || li.productName
      if (!key) continue
      const existing = byProduct.get(key)
      const qty = Number(li.quantity || 0)
      const cost = toNumber(li.totalPrice)
      if (existing) {
        existing.quantity += qty
        existing.totalCost += cost
      } else {
        byProduct.set(key, {
          productId: key,
          productName: li.productName || key,
          quantity: qty,
          totalCost: cost
        })
      }
    }

    const items = Array.from(byProduct.values()).sort((a, b) => b.totalCost - a.totalCost)
    const totals = items.reduce(
      (s, r) => ({ quantity: s.quantity + r.quantity, totalCost: s.totalCost + r.totalCost }),
      { quantity: 0, totalCost: 0 }
    )

    return NextResponse.json({ range: { from: fromOut, to: toOut }, locationId, items, totals })
  } catch (e) {
    return NextResponse.json(
      {
        range: { from: fromOut, to: toOut },
        locationId,
        items: [],
        totals: { quantity: 0, totalCost: 0 }
      },
      { status: 500 }
    )
  }
}
