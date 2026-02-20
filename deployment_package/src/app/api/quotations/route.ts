import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/config/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [items, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.quotation.count({ where })
    ])

    return NextResponse.json({
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching quotations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotations', details: message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      customerId, customerName, serviceType, status, saleDate,
      invoiceScheme, invoiceNo, salesOrder, discountType, discountAmount,
      orderTax, sellNote, shippingDetails, shippingAddress, shippingCharges,
      shippingStatus, deliveredTo, deliveryPerson, lineItems,
      subtotal, totalPayable
    } = body

    // Generate quotation number
    const count = await prisma.quotation.count()
    const quotationNumber = invoiceNo || `QT-${String(count + 1).padStart(6, '0')}`

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: customerId || null,
        customerName: customerName || null,
        serviceType: serviceType || null,
        status: status || 'Draft',
        saleDate: saleDate ? new Date(saleDate) : new Date(),
        invoiceScheme: invoiceScheme || null,
        invoiceNo: invoiceNo || null,
        salesOrder: salesOrder || null,
        discountType: discountType || null,
        discountAmount: parseFloat(discountAmount) || 0,
        orderTax: orderTax || null,
        sellNote: sellNote || null,
        shippingDetails: shippingDetails || null,
        shippingAddress: shippingAddress || null,
        shippingCharges: parseFloat(shippingCharges) || 0,
        shippingStatus: shippingStatus || null,
        deliveredTo: deliveredTo || null,
        deliveryPerson: deliveryPerson || null,
        lineItems: JSON.stringify(lineItems || []),
        subtotal: parseFloat(subtotal) || 0,
        totalPayable: parseFloat(totalPayable) || 0
      }
    })

    return NextResponse.json({ success: true, quotation }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating quotation:', error)
    return NextResponse.json(
      { error: 'Failed to create quotation', details: message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Quotation ID is required' }, { status: 400 })
    }

    await prisma.quotation.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Quotation deleted' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error deleting quotation:', error)
    return NextResponse.json(
      { error: 'Failed to delete quotation', details: message },
      { status: 500 }
    )
  }
}
