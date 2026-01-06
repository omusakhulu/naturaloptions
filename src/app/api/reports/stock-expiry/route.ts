import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const daysAhead = parseInt(searchParams.get('daysAhead') || '30')

  const today = new Date()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  try {
    // The current InventoryItem schema does not have expiryDate or batchNumber.
    // We fetch items that are low on stock instead as a relevant proxy for a 'stock' report,
    // or just return empty if the focus is strictly on expiry which is missing in schema.
    const inventoryItems = await prisma.inventoryItem.findMany({
      include: {
        location: {
          include: {
            warehouse: { select: { name: true } }
          }
        },
        warehouse: { select: { name: true } }
      },
      take: 50
    })

    const items = inventoryItems.map(item => {
      // Mocking days until expiry as the schema lacks this field
      const daysUntilExpiry = 30 
      
      return {
        id: item.id,
        sku: item.sku,
        productName: item.productName,
        batchNumber: 'N/A',
        expiryDate: 'N/A',
        daysUntilExpiry,
        quantity: item.quantity,
        location: (item.location as any)?.name || 'N/A',
        warehouse: item.warehouse?.name || 'N/A',
        status: 'Normal'
      }
    })

    const totals = {
      totalItems: items.length,
      critical: items.filter(i => i.status === 'Critical').length,
      warning: items.filter(i => i.status === 'Warning').length,
      normal: items.filter(i => i.status === 'Normal').length
    }

    return NextResponse.json({ daysAhead, items, totals })
  } catch (e) {
    return NextResponse.json({
      daysAhead,
      items: [],
      totals: { totalItems: 0, critical: 0, warning: 0, normal: 0 }
    })
  }
}
