import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Generate unique PO number
async function generatePONumber(): Promise<string> {
  const date = new Date()
  const prefix = `PO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
  
  const lastPO = await prisma.purchaseOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' }
  })

  if (lastPO) {
    const lastNumber = parseInt(lastPO.orderNumber.split('-').pop() || '0')
    return `${prefix}-${String(lastNumber + 1).padStart(4, '0')}`
  }
  
  return `${prefix}-0001`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const vendorId = searchParams.get('vendorId')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (vendorId) {
      where.vendorId = vendorId
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (startDate || endDate) {
      where.orderDate = {}
      if (startDate) where.orderDate.gte = new Date(startDate)
      if (endDate) where.orderDate.lte = new Date(endDate)
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          vendor: {
            select: { id: true, name: true, email: true, phone: true }
          },
          items: true,
          requisition: {
            select: { id: true, requisitionNumber: true }
          }
        },
        orderBy: { orderDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.purchaseOrder.count({ where })
    ])

    // Get summary stats
    const stats = await prisma.purchaseOrder.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { totalAmount: true }
    })

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    })
  } catch (error: any) {
    console.error('Error fetching purchase orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const {
      vendorId,
      expectedDate,
      warehouseId,
      notes,
      terms,
      items,
      requisitionId,
      createdBy
    } = data

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }

    const orderNumber = await generatePONumber()

    // Calculate totals
    let subtotal = 0
    let taxAmount = 0

    const processedItems = items.map((item: any) => {
      const itemTotal = item.quantity * parseFloat(item.unitPrice)
      const itemTax = itemTotal * (parseFloat(item.taxRate || 0) / 100)
      const itemDiscount = parseFloat(item.discount || 0)
      const lineTotal = itemTotal + itemTax - itemDiscount

      subtotal += itemTotal
      taxAmount += itemTax

      return {
        sku: item.sku,
        productName: item.productName,
        description: item.description || null,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        taxRate: parseFloat(item.taxRate || 0),
        discount: itemDiscount,
        totalPrice: lineTotal,
        batchNumber: item.batchNumber || null,
        lotNumber: item.lotNumber || null,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : null
      }
    })

    const discount = parseFloat(data.discount || 0)
    const shippingCost = parseFloat(data.shippingCost || 0)
    const totalAmount = subtotal + taxAmount + shippingCost - discount

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        vendorId,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        warehouseId: warehouseId || null,
        notes: notes || null,
        terms: terms || null,
        requisitionId: requisitionId || null,
        createdBy: createdBy || null,
        subtotal,
        taxAmount,
        shippingCost,
        discount,
        totalAmount,
        status: 'DRAFT',
        paymentStatus: 'PENDING',
        items: {
          create: processedItems
        }
      },
      include: {
        vendor: true,
        items: true
      }
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to create purchase order', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id, items, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: 'Purchase Order ID is required' }, { status: 400 })
    }

    // Check if order exists
    const existingOrder = await prisma.purchaseOrder.findUnique({ where: { id } })
    if (!existingOrder) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 })
    }

    // Prepare update data
    const orderUpdate: any = {}

    if (updateData.vendorId) orderUpdate.vendorId = updateData.vendorId
    if (updateData.expectedDate) orderUpdate.expectedDate = new Date(updateData.expectedDate)
    if (updateData.warehouseId !== undefined) orderUpdate.warehouseId = updateData.warehouseId
    if (updateData.notes !== undefined) orderUpdate.notes = updateData.notes
    if (updateData.terms !== undefined) orderUpdate.terms = updateData.terms
    if (updateData.status) orderUpdate.status = updateData.status
    if (updateData.paymentStatus) orderUpdate.paymentStatus = updateData.paymentStatus

    // Handle approval
    if (updateData.status === 'APPROVED' && updateData.approvedBy) {
      orderUpdate.approvedBy = updateData.approvedBy
      orderUpdate.approvedAt = new Date()
    }

    // Handle items update if provided
    if (items && Array.isArray(items)) {
      // Delete existing items and recreate
      await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } })

      let subtotal = 0
      let taxAmount = 0

      const processedItems = items.map((item: any) => {
        const itemTotal = item.quantity * parseFloat(item.unitPrice)
        const itemTax = itemTotal * (parseFloat(item.taxRate || 0) / 100)
        const itemDiscount = parseFloat(item.discount || 0)
        const lineTotal = itemTotal + itemTax - itemDiscount

        subtotal += itemTotal
        taxAmount += itemTax

        return {
          purchaseOrderId: id,
          sku: item.sku,
          productName: item.productName,
          description: item.description || null,
          quantity: item.quantity,
          receivedQty: item.receivedQty || 0,
          unitPrice: parseFloat(item.unitPrice),
          taxRate: parseFloat(item.taxRate || 0),
          discount: itemDiscount,
          totalPrice: lineTotal,
          batchNumber: item.batchNumber || null,
          lotNumber: item.lotNumber || null,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : null
        }
      })

      await prisma.purchaseOrderItem.createMany({ data: processedItems })

      const discount = parseFloat(updateData.discount || existingOrder.discount.toString())
      const shippingCost = parseFloat(updateData.shippingCost || existingOrder.shippingCost.toString())
      
      orderUpdate.subtotal = subtotal
      orderUpdate.taxAmount = taxAmount
      orderUpdate.shippingCost = shippingCost
      orderUpdate.discount = discount
      orderUpdate.totalAmount = subtotal + taxAmount + shippingCost - discount
    }

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: orderUpdate,
      include: {
        vendor: true,
        items: true
      }
    })

    return NextResponse.json(order)
  } catch (error: any) {
    console.error('Error updating purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to update purchase order', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Purchase Order ID is required' }, { status: 400 })
    }

    const existingOrder = await prisma.purchaseOrder.findUnique({ where: { id } })
    if (!existingOrder) {
      return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 })
    }

    // Only allow deletion of DRAFT orders
    if (existingOrder.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft purchase orders can be deleted' },
        { status: 400 }
      )
    }

    await prisma.purchaseOrder.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Purchase order deleted' })
  } catch (error: any) {
    console.error('Error deleting purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to delete purchase order', details: error.message },
      { status: 500 }
    )
  }
}
