import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/config/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const quotation = await prisma.quotation.findUnique({ where: { id } })

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    return NextResponse.json(quotation)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching quotation:', error)
    return NextResponse.json({ error: 'Failed to fetch quotation', details: message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const {
      customerId, customerName, serviceType, status, saleDate,
      invoiceScheme, invoiceNo, salesOrder, discountType, discountAmount,
      orderTax, sellNote, shippingDetails, shippingAddress, shippingCharges,
      shippingStatus, deliveredTo, deliveryPerson, lineItems,
      subtotal, totalPayable
    } = body

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        customerId: customerId ?? undefined,
        customerName: customerName ?? undefined,
        serviceType: serviceType ?? undefined,
        status: status ?? undefined,
        saleDate: saleDate ? new Date(saleDate) : undefined,
        invoiceScheme: invoiceScheme ?? undefined,
        invoiceNo: invoiceNo ?? undefined,
        salesOrder: salesOrder ?? undefined,
        discountType: discountType ?? undefined,
        discountAmount: discountAmount != null ? parseFloat(discountAmount) || 0 : undefined,
        orderTax: orderTax ?? undefined,
        sellNote: sellNote ?? undefined,
        shippingDetails: shippingDetails ?? undefined,
        shippingAddress: shippingAddress ?? undefined,
        shippingCharges: shippingCharges != null ? parseFloat(shippingCharges) || 0 : undefined,
        shippingStatus: shippingStatus ?? undefined,
        deliveredTo: deliveredTo ?? undefined,
        deliveryPerson: deliveryPerson ?? undefined,
        lineItems: lineItems ? JSON.stringify(lineItems) : undefined,
        subtotal: subtotal != null ? parseFloat(subtotal) || 0 : undefined,
        totalPayable: totalPayable != null ? parseFloat(totalPayable) || 0 : undefined
      }
    })

    return NextResponse.json({ success: true, quotation })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error updating quotation:', error)
    return NextResponse.json({ error: 'Failed to update quotation', details: message }, { status: 500 })
  }
}
