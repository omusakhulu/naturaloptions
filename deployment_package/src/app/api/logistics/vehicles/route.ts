import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/config/auth'
import prisma from '@/lib/prisma'

// GET /api/logistics/vehicles - Get all vehicles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        drivers: true,
        deliveries: {
          where: {
            scheduledDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today onwards
            }
          },
          include: {
            driver: true,
            order: true
          }
        }
      },
      orderBy: {
        registrationNo: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      vehicles
    })
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}

// POST /api/logistics/vehicles - Create new vehicle
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

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

    if (!registrationNo || !make || !model) {
      return NextResponse.json(
        { success: false, error: 'Registration number, make, and model are required' },
        { status: 400 }
      )
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNo,
        make,
        model,
        year: year ? parseInt(year) : null,
        type: type || 'TRUCK',
        capacity: capacity ? parseFloat(capacity) : null,
        fuelType,
        engineCapacity: engineCapacity ? parseFloat(engineCapacity) : null,
        fuelConsumption: fuelConsumption ? parseFloat(fuelConsumption) : null,
        lastService: lastService ? new Date(lastService) : null,
        nextService: nextService ? new Date(nextService) : null,
        status: 'AVAILABLE'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Vehicle created successfully',
      vehicle
    })
  } catch (error) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create vehicle' },
      { status: 500 }
    )
  }
}
