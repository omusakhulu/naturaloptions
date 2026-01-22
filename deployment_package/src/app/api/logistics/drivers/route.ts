import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/config/auth'
import prisma from '@/lib/prisma'

// GET /api/logistics/drivers - Get all drivers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where = status ? { status: status as any } : {}

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        vehicle: true,
        deliveries: {
          where: {
            scheduledDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today onwards
            }
          },
          include: {
            order: true
          },
          orderBy: {
            scheduledDate: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      drivers
    })
  } catch (error) {
    console.error('Error fetching drivers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drivers' },
      { status: 500 }
    )
  }
}

// POST /api/logistics/drivers - Create new driver
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, licenseNumber, licenseExpiry, vehicleId, userId } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Driver name is required' },
        { status: 400 }
      )
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        email,
        phone,
        licenseNumber,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        vehicleId,
        userId,
        status: 'AVAILABLE'
      },
      include: {
        vehicle: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Driver created successfully',
      driver
    })
  } catch (error) {
    console.error('Error creating driver:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create driver' },
      { status: 500 }
    )
  }
}
