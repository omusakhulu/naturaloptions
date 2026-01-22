import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

import { getPackingSlipByWooOrderId } from '@/lib/db/packingSlips'

// GET movements for a warehouse
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const where: any = { warehouseId: id }

    if (type) where.type = type

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        inventory: {
          select: {
            sku: true,
            productName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Fetch packing slips for order-related movements
    const movementsWithPackingSlips = await Promise.all(
      movements.map(async movement => {
        let packingSlip = null

        // Check if this movement has an order reference
        if (movement.referenceNumber && movement.referenceNumber.startsWith('ORDER-')) {
          const orderNumber = movement.referenceNumber.replace('ORDER-', '')

          // Try to find the order and its packing slip
          const order = await prisma.order.findFirst({
            where: { orderNumber }
          })

          if (order) {
            packingSlip = await getPackingSlipByWooOrderId(order.wooId)
          }
        }

        return {
          ...movement,
          packingSlip
        }
      })
    )

    return NextResponse.json({
      success: true,
      movements: movementsWithPackingSlips,
      count: movementsWithPackingSlips.length
    })
  } catch (error: any) {
    console.error('Error fetching movements:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch movements'
      },
      { status: 500 }
    )
  }
}

// POST create stock movement
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()

    // Update inventory quantity
    const inventory = await prisma.inventoryItem.findUnique({
      where: { id: data.inventoryId }
    })

    if (!inventory) {
      return NextResponse.json({ success: false, error: 'Inventory item not found' }, { status: 404 })
    }

    let newQuantity = inventory.quantity

    switch (data.type) {
      case 'inbound':
      case 'return':
        newQuantity += data.quantity
        break
      case 'outbound':
      case 'transfer':
        newQuantity -= data.quantity
        break
      case 'adjustment':
        newQuantity = data.quantity
        break
    }

    // Create movement and update inventory in a transaction
    const [movement] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          warehouseId: id,
          inventoryId: data.inventoryId,
          type: data.type,
          quantity: data.quantity,
          fromLocation: data.fromLocation || null,
          toLocation: data.toLocation || null,
          referenceNumber: data.referenceNumber || null,
          notes: data.notes || null,
          performedBy: data.performedBy || null
        }
      }),
      prisma.inventoryItem.update({
        where: { id: data.inventoryId },
        data: { quantity: newQuantity }
      })
    ])

    return NextResponse.json({
      success: true,
      movement
    })
  } catch (error: any) {
    console.error('Error creating movement:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create movement'
      },
      { status: 500 }
    )
  }
}
