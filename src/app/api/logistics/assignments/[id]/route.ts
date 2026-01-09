import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/logistics/assignments/[id] - Get single assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const assignment = await prisma.deliveryAssignment.findUnique({
      where: { id },
      include: {
        driver: true,
        vehicle: true,
        order: true
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      assignment
    })
  } catch (error) {
    console.error('Error fetching assignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignment' },
      { status: 500 }
    )
  }
}

// PUT /api/logistics/assignments/[id] - Update assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      driverId,
      vehicleId,
      scheduledDate,
      scheduledTime,
      status,
      priority,
      route,
      notes,
      startTime,
      completedTime
    } = body

    // Get the current assignment to check old driver/vehicle
    const currentAssignment = await prisma.deliveryAssignment.findUnique({
      where: { id }
    })

    if (!currentAssignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Update driver status if changed
    if (driverId && driverId !== currentAssignment.driverId) {
      // Set old driver to AVAILABLE
      await prisma.driver.update({
        where: { id: currentAssignment.driverId },
        data: { status: 'AVAILABLE' }
      })
      // Set new driver to ON_DELIVERY
      await prisma.driver.update({
        where: { id: driverId },
        data: { status: 'ON_DELIVERY' }
      })
    }

    // Update vehicle status if changed
    if (vehicleId && vehicleId !== currentAssignment.vehicleId) {
      // Set old vehicle to AVAILABLE
      await prisma.vehicle.update({
        where: { id: currentAssignment.vehicleId },
        data: { status: 'AVAILABLE' }
      })
      // Set new vehicle to IN_USE
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'IN_USE' }
      })
    }

    // If status is COMPLETED or CANCELLED, free up driver and vehicle
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      await prisma.driver.update({
        where: { id: currentAssignment.driverId },
        data: { status: 'AVAILABLE' }
      })
      await prisma.vehicle.update({
        where: { id: currentAssignment.vehicleId },
        data: { status: 'AVAILABLE' }
      })
    }

    const assignment = await prisma.deliveryAssignment.update({
      where: { id },
      data: {
        driverId,
        vehicleId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        scheduledTime,
        status,
        priority,
        route,
        notes,
        startTime: startTime ? new Date(startTime) : undefined,
        completedTime: completedTime ? new Date(completedTime) : undefined
      },
      include: {
        driver: true,
        vehicle: true,
        order: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment
    })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}

// DELETE /api/logistics/assignments/[id] - Delete assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Get the assignment to free up driver and vehicle
    const assignment = await prisma.deliveryAssignment.findUnique({
      where: { id }
    })

    if (assignment) {
      // Free up driver
      await prisma.driver.update({
        where: { id: assignment.driverId },
        data: { status: 'AVAILABLE' }
      })
      // Free up vehicle
      await prisma.vehicle.update({
        where: { id: assignment.vehicleId },
        data: { status: 'AVAILABLE' }
      })
    }

    await prisma.deliveryAssignment.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}
