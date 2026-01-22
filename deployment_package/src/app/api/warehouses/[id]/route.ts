import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

// GET single warehouse
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: {
          orderBy: { locationCode: 'asc' }
        },
        inventory: {
          include: {
            location: true
          },
          orderBy: { productName: 'asc' }
        },
        _count: {
          select: {
            locations: true,
            inventory: true,
            movements: true
          }
        }
      }
    })

    if (!warehouse) {
      return NextResponse.json(
        {
          success: false,
          error: 'Warehouse not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      warehouse
    })
  } catch (error: any) {
    console.error('Error fetching warehouse:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch warehouse'
      },
      { status: 500 }
    )
  }
}

// PUT update warehouse
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        postalCode: data.postalCode || null,
        phone: data.phone || null,
        email: data.email || null,
        managerName: data.managerName || null,
        capacity: data.capacity || null,
        status: data.status
      }
    })

    return NextResponse.json({
      success: true,
      warehouse
    })
  } catch (error: any) {
    console.error('Error updating warehouse:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update warehouse'
      },
      { status: 500 }
    )
  }
}

// DELETE warehouse
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.warehouse.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Warehouse deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting warehouse:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete warehouse'
      },
      { status: 500 }
    )
  }
}
