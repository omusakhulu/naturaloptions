import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { prisma } from '@/lib/prisma'
import { authOptions } from '@/config/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const locationId = searchParams.get('locationId')

    // Build where clause — only items with expiry dates and stock > 0
    const where: any = {
      expiryDate: { not: null },
      quantity: { gt: 0 }
    }

    // If date range provided, filter by expiry date range
    if (from || to) {
      where.expiryDate = { ...where.expiryDate }
      if (from) where.expiryDate.gte = new Date(from)
      if (to) where.expiryDate.lte = new Date(to)
    }

    if (locationId) {
      where.locationId = locationId
    }

    const inventoryLocations = await prisma.inventoryLocation.findMany({
      where,
      include: {
        product: {
          select: { id: true, sku: true, name: true, price: true }
        },
        location: {
          select: { id: true, name: true }
        }
      },
      orderBy: { expiryDate: 'asc' },
      take: 200
    })

    const today = new Date()

    const items = inventoryLocations.map(inv => {
      const daysUntilExpiry = inv.expiryDate
        ? Math.ceil((inv.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null

      const unitPrice = parseFloat(inv.product.price || '0')
      const value = inv.quantity * unitPrice

      let status = 'Normal'

      if (daysUntilExpiry !== null) {
        if (daysUntilExpiry <= 0) status = 'Expired'
        else if (daysUntilExpiry <= 30) status = 'Critical'
        else if (daysUntilExpiry <= 90) status = 'Warning'
      }

      return {
        id: inv.id,
        sku: inv.product.sku || '',
        productName: inv.product.name,
        batchNumber: inv.batchNumber || '',
        expiryDate: inv.expiryDate?.toISOString().slice(0, 10) || '',
        daysUntilExpiry,
        quantity: inv.quantity,
        value,
        warehouse: inv.location.name, // frontend expects 'warehouse' field name
        status
      }
    })

    // Group by location for chart data
    const byLocationMap: Record<string, number> = {}

    for (const item of items) {
      byLocationMap[item.warehouse] = (byLocationMap[item.warehouse] || 0) + item.value
    }

    const byWarehouse = Object.entries(byLocationMap).map(([warehouse, valueAtRisk]) => ({ warehouse, valueAtRisk }))

    const totals = {
      totalItems: items.length,
      expired: items.filter(i => i.status === 'Expired').length,
      critical: items.filter(i => i.status === 'Critical').length,
      warning: items.filter(i => i.status === 'Warning').length,
      normal: items.filter(i => i.status === 'Normal').length
    }

    return NextResponse.json({
      range: { from: from || '', to: to || '' },
      locationId: locationId || '',
      items,
      byWarehouse,
      totals
    })
  } catch (error: any) {
    console.error('Stock expiry report error:', error)

    return NextResponse.json({
      range: { from: '', to: '' },
      items: [],
      byWarehouse: [],
      totals: { totalItems: 0, expired: 0, critical: 0, warning: 0, normal: 0 }
    })
  }
}
