import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Generate unique requisition number
async function generateRequisitionNumber(): Promise<string> {
  const date = new Date()
  const prefix = `REQ-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
  
  const lastReq = await prisma.purchaseRequisition.findFirst({
    where: { requisitionNumber: { startsWith: prefix } },
    orderBy: { requisitionNumber: 'desc' }
  })

  if (lastReq) {
    const lastNumber = parseInt(lastReq.requisitionNumber.split('-').pop() || '0')
    return `${prefix}-${String(lastNumber + 1).padStart(4, '0')}`
  }
  
  return `${prefix}-0001`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const requestedBy = searchParams.get('requestedBy')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (id) {
      const requisition = await prisma.purchaseRequisition.findUnique({
        where: { id },
        include: {
          items: true,
          purchaseOrders: {
            select: { id: true, orderNumber: true, status: true }
          }
        }
      })

      if (!requisition) {
        return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
      }

      return NextResponse.json({ requisition })
    }

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (requestedBy) {
      where.requestedBy = requestedBy
    }

    if (search) {
      where.OR = [
        { requisitionNumber: { contains: search, mode: 'insensitive' } },
        { requestedFor: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (startDate || endDate) {
      where.requestDate = {}
      if (startDate) where.requestDate.gte = new Date(startDate)
      if (endDate) where.requestDate.lte = new Date(endDate)
    }

    const [requisitions, total] = await Promise.all([
      prisma.purchaseRequisition.findMany({
        where,
        include: {
          items: true,
          purchaseOrders: {
            select: { id: true, orderNumber: true, status: true }
          }
        },
        orderBy: { requestDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.purchaseRequisition.count({ where })
    ])

    // Get summary stats
    const stats = await prisma.purchaseRequisition.groupBy({
      by: ['status'],
      _count: { id: true }
    })

    return NextResponse.json({
      requisitions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    })
  } catch (error: any) {
    console.error('Error fetching purchase requisitions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase requisitions', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const {
      requestedBy,
      requestedFor,
      requiredDate,
      priority,
      reason,
      notes,
      items
    } = data

    if (!requestedBy) {
      return NextResponse.json({ error: 'Requester ID is required' }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }

    const requisitionNumber = await generateRequisitionNumber()

    const processedItems = items.map((item: any) => ({
      sku: item.sku || null,
      productName: item.productName,
      description: item.description || null,
      quantity: item.quantity,
      alertQuantity: typeof item.alertQuantity === 'number' ? item.alertQuantity : parseInt(item.alertQuantity || '0'),
      estimatedPrice: item.estimatedPrice ? parseFloat(item.estimatedPrice) : null,
      preferredVendor: item.preferredVendor || null
    }))

    const requisition = await prisma.purchaseRequisition.create({
      data: {
        requisitionNumber,
        requestedBy,
        requestedFor: requestedFor || null,
        requiredDate: requiredDate ? new Date(requiredDate) : null,
        priority: priority || 'NORMAL',
        reason: reason || null,
        notes: notes || null,
        status: 'PENDING',
        items: {
          create: processedItems
        }
      },
      include: {
        items: true
      }
    })

    return NextResponse.json(requisition, { status: 201 })
  } catch (error: any) {
    console.error('Error creating purchase requisition:', error)
    return NextResponse.json(
      { error: 'Failed to create purchase requisition', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id, items, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: 'Requisition ID is required' }, { status: 400 })
    }

    const existingReq = await prisma.purchaseRequisition.findUnique({ where: { id } })
    if (!existingReq) {
      return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
    }

    const reqUpdate: any = {}

    if (updateData.requestedFor !== undefined) reqUpdate.requestedFor = updateData.requestedFor
    if (updateData.requiredDate) reqUpdate.requiredDate = new Date(updateData.requiredDate)
    if (updateData.priority) reqUpdate.priority = updateData.priority
    if (updateData.reason !== undefined) reqUpdate.reason = updateData.reason
    if (updateData.notes !== undefined) reqUpdate.notes = updateData.notes
    if (updateData.status) reqUpdate.status = updateData.status

    // Handle approval
    if (updateData.status === 'APPROVED' && updateData.approvedBy) {
      reqUpdate.approvedBy = updateData.approvedBy
      reqUpdate.approvedAt = new Date()
    }

    // Handle rejection
    if (updateData.status === 'REJECTED' && updateData.rejectedBy) {
      reqUpdate.rejectedBy = updateData.rejectedBy
      reqUpdate.rejectedAt = new Date()
      reqUpdate.rejectionReason = updateData.rejectionReason || null
    }

    // Handle items update if provided
    if (items && Array.isArray(items)) {
      await prisma.purchaseRequisitionItem.deleteMany({ where: { requisitionId: id } })

      const processedItems = items.map((item: any) => ({
        requisitionId: id,
        sku: item.sku || null,
        productName: item.productName,
        description: item.description || null,
        quantity: item.quantity,
        alertQuantity: typeof item.alertQuantity === 'number' ? item.alertQuantity : parseInt(item.alertQuantity || '0'),
        estimatedPrice: item.estimatedPrice ? parseFloat(item.estimatedPrice) : null,
        preferredVendor: item.preferredVendor || null
      }))

      await prisma.purchaseRequisitionItem.createMany({ data: processedItems })
    }

    const requisition = await prisma.purchaseRequisition.update({
      where: { id },
      data: reqUpdate,
      include: {
        items: true,
        purchaseOrders: {
          select: { id: true, orderNumber: true, status: true }
        }
      }
    })

    return NextResponse.json(requisition)
  } catch (error: any) {
    console.error('Error updating purchase requisition:', error)
    return NextResponse.json(
      { error: 'Failed to update purchase requisition', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Requisition ID is required' }, { status: 400 })
    }

    const existingReq = await prisma.purchaseRequisition.findUnique({ where: { id } })
    if (!existingReq) {
      return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
    }

    // Only allow deletion of PENDING requisitions
    if (existingReq.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending requisitions can be deleted' },
        { status: 400 }
      )
    }

    await prisma.purchaseRequisition.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Requisition deleted' })
  } catch (error: any) {
    console.error('Error deleting requisition:', error)
    return NextResponse.json(
      { error: 'Failed to delete requisition', details: error.message },
      { status: 500 }
    )
  }
}
