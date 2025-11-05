import { NextRequest, NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET all warehouses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}

    if (status) where.status = status

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        _count: {
          select: {
            locations: true,
            inventory: true,
            movements: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      warehouses,
      count: warehouses.length
    })
  } catch (error: any) {
    console.error('Error fetching warehouses:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch warehouses'
      },
      { status: 500 }
    )
  }
}

// POST create warehouse
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const warehouse = await prisma.warehouse.create({
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
        status: data.status || 'active'
      }
    })

    return NextResponse.json({
      success: true,
      warehouse
    })
  } catch (error: any) {
    console.error('Error creating warehouse:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create warehouse'
      },
      { status: 500 }
    )
  }
}
