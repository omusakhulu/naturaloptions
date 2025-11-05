import { NextRequest, NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET inventory for a warehouse
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const inventory = await prisma.inventoryItem.findMany({
      where: { warehouseId: id },
      include: {
        location: true
      },
      orderBy: { productName: 'asc' }
    })

    return NextResponse.json({
      success: true,
      inventory,
      count: inventory.length
    })
  } catch (error: any) {
    console.error('Error fetching inventory:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch inventory'
      },
      { status: 500 }
    )
  }
}

// POST add inventory item
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()

    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        warehouseId: id,
        locationId: data.locationId || null,
        sku: data.sku,
        productName: data.productName,
        description: data.description || null,
        category: data.category || null,
        quantity: data.quantity || 0,
        reorderLevel: data.reorderLevel || 10,
        unit: data.unit || 'pcs',
        costPrice: data.costPrice || null,
        sellingPrice: data.sellingPrice || null
      }
    })

    return NextResponse.json({
      success: true,
      inventoryItem
    })
  } catch (error: any) {
    console.error('Error adding inventory:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to add inventory'
      },
      { status: 500 }
    )
  }
}
