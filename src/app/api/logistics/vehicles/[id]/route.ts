import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/logistics/vehicles/[id] - Get single vehicle
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      include: {
        drivers: true,
        deliveries: {
          include: {
            driver: true,
            order: true
          },
          orderBy: {
            scheduledDate: 'desc'
          }
        }
      }
    })

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      vehicle
    })
  } catch (error) {
    console.error('Error fetching vehicle:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle' },
      { status: 500 }
    )
  }
}

// PUT /api/logistics/vehicles/[id] - Update vehicle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      registrationNo,
      make,
      model,
      year,
      type,
      capacity,
      status,
      mileage,
      fuelType,
      engineCapacity,
      fuelConsumption,
      lastService,
      nextService
    } = body

    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        registrationNo,
        make,
        model,
        year: year ? parseInt(year) : null,
        type,
        capacity: capacity ? parseFloat(capacity) : null,
        status,
        mileage: mileage ? parseFloat(mileage) : null,
        fuelType,
        engineCapacity: engineCapacity ? parseFloat(engineCapacity) : null,
        fuelConsumption: fuelConsumption ? parseFloat(fuelConsumption) : null,
        lastService: lastService ? new Date(lastService) : null,
        nextService: nextService ? new Date(nextService) : null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle
    })
  } catch (error) {
    console.error('Error updating vehicle:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle' },
      { status: 500 }
    )
  }
}

// DELETE /api/logistics/vehicles/[id] - Delete vehicle
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.vehicle.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Vehicle deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete vehicle' },
      { status: 500 }
    )
  }
}
