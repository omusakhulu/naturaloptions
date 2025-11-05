import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/logistics/assignments - Get delivery assignments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const driverId = searchParams.get('driverId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    
    if (status) where.status = status
    if (driverId) where.driverId = driverId
    
    // Date range filtering for calendar view
    if (startDate && endDate) {
      where.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else if (startDate) {
      where.scheduledDate = {
        gte: new Date(startDate)
      }
    }

    const assignments = await prisma.deliveryAssignment.findMany({
      where,
      include: {
        driver: true,
        vehicle: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            shippingAddress: true,
            customer: true,
            lineItems: true
          }
        }
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      assignments
    })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

// POST /api/logistics/assignments - Create delivery assignment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderId,
      driverId,
      vehicleId,
      scheduledDate,
      scheduledTime,
      priority,
      route,
      notes
    } = body

    if (!orderId || !driverId || !vehicleId || !scheduledDate) {
      return NextResponse.json(
        { success: false, error: 'Order, driver, vehicle, and scheduled date are required' },
        { status: 400 }
      )
    }

    // Update driver status to ON_DELIVERY
    await prisma.driver.update({
      where: { id: driverId },
      data: { status: 'ON_DELIVERY' }
    })

    // Update vehicle status to IN_USE
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'IN_USE' }
    })

    const assignment = await prisma.deliveryAssignment.create({
      data: {
        orderId,
        driverId,
        vehicleId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        priority: priority || 'NORMAL',
        route,
        notes,
        status: 'SCHEDULED'
      },
      include: {
        driver: true,
        vehicle: true,
        order: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Delivery assignment created successfully',
      assignment
    })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}
