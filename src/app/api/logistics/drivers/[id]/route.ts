import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/logistics/drivers/[id] - Get single driver
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: params.id },
      include: {
        vehicle: true,
        deliveries: {
          include: {
            order: true,
            vehicle: true
          },
          orderBy: {
            scheduledDate: 'desc'
          }
        }
      }
    })

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      driver
    })
  } catch (error) {
    console.error('Error fetching driver:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch driver' },
      { status: 500 }
    )
  }
}

// PUT /api/logistics/drivers/[id] - Update driver
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, email, phone, licenseNumber, licenseExpiry, status, vehicleId } = body

    const driver = await prisma.driver.update({
      where: { id: params.id },
      data: {
        name,
        email,
        phone,
        licenseNumber,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        status,
        vehicleId
      },
      include: {
        vehicle: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Driver updated successfully',
      driver
    })
  } catch (error) {
    console.error('Error updating driver:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update driver' },
      { status: 500 }
    )
  }
}

// DELETE /api/logistics/drivers/[id] - Delete driver
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.driver.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Driver deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting driver:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete driver' },
      { status: 500 }
    )
  }
}
