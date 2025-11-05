import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/logistics/dashboard/stats - Get logistics dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Get today's date range
    const today = new Date()
    const todayStart = new Date(today.setHours(0, 0, 0, 0))
    const todayEnd = new Date(today.setHours(23, 59, 59, 999))

    // Get this week's date range
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // Total drivers and vehicles
    const [
      totalDrivers,
      totalVehicles,
      availableDrivers,
      availableVehicles,
      onDeliveryDrivers,
      vehiclesInUse
    ] = await Promise.all([
      prisma.driver.count(),
      prisma.vehicle.count(),
      prisma.driver.count({ where: { status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
      prisma.driver.count({ where: { status: 'ON_DELIVERY' } }),
      prisma.vehicle.count({ where: { status: 'IN_USE' } })
    ])

    // Deliveries statistics
    const [
      todayDeliveries,
      weekDeliveries,
      scheduledDeliveries,
      inProgressDeliveries,
      completedToday,
      completedThisWeek
    ] = await Promise.all([
      prisma.deliveryAssignment.count({
        where: {
          scheduledDate: {
            gte: todayStart,
            lte: todayEnd
          }
        }
      }),
      prisma.deliveryAssignment.count({
        where: {
          scheduledDate: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      }),
      prisma.deliveryAssignment.count({ where: { status: 'SCHEDULED' } }),
      prisma.deliveryAssignment.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.deliveryAssignment.count({
        where: {
          status: 'COMPLETED',
          completedTime: {
            gte: todayStart,
            lte: todayEnd
          }
        }
      }),
      prisma.deliveryAssignment.count({
        where: {
          status: 'COMPLETED',
          completedTime: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      })
    ])

    // Recent assignments (next 7 days)
    const upcomingAssignments = await prisma.deliveryAssignment.findMany({
      where: {
        scheduledDate: {
          gte: todayStart,
          lte: new Date(new Date().setDate(new Date().getDate() + 7))
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      },
      include: {
        driver: true,
        vehicle: true,
        order: {
          select: {
            orderNumber: true,
            total: true,
            customer: true
          }
        }
      },
      orderBy: {
        scheduledDate: 'asc'
      },
      take: 10
    })

    // Drivers with today's assignments
    const driversScheduledToday = await prisma.driver.findMany({
      where: {
        deliveries: {
          some: {
            scheduledDate: {
              gte: todayStart,
              lte: todayEnd
            }
          }
        }
      },
      include: {
        vehicle: true,
        deliveries: {
          where: {
            scheduledDate: {
              gte: todayStart,
              lte: todayEnd
            }
          },
          include: {
            order: {
              select: {
                orderNumber: true,
                total: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      stats: {
        fleet: {
          totalDrivers,
          totalVehicles,
          availableDrivers,
          availableVehicles,
          onDeliveryDrivers,
          vehiclesInUse,
          utilization: {
            drivers: totalDrivers > 0 ? ((onDeliveryDrivers / totalDrivers) * 100).toFixed(1) : '0',
            vehicles: totalVehicles > 0 ? ((vehiclesInUse / totalVehicles) * 100).toFixed(1) : '0'
          }
        },
        deliveries: {
          today: todayDeliveries,
          thisWeek: weekDeliveries,
          scheduled: scheduledDeliveries,
          inProgress: inProgressDeliveries,
          completedToday,
          completedThisWeek
        },
        upcoming: upcomingAssignments,
        driversToday: driversScheduledToday
      }
    })
  } catch (error) {
    console.error('Error fetching logistics stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logistics statistics' },
      { status: 500 }
    )
  }
}
