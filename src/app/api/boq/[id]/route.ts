import { NextRequest, NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const boqId = parseInt(id)

    if (isNaN(boqId)) {
      return NextResponse.json({ success: false, error: 'Invalid BOQ ID' }, { status: 400 })
    }

    const boq = await prisma.bOQ.findUnique({
      where: { id: boqId }
    })

    if (!boq) {
      return NextResponse.json({ success: false, error: 'BOQ not found' }, { status: 404 })
    }

    // Parse sections from JSON
    const sections = typeof boq.sections === 'string' ? JSON.parse(boq.sections) : boq.sections

    return NextResponse.json({
      success: true,
      boq: {
        ...boq,
        sections
      }
    })
  } catch (error: any) {
    console.error('Error fetching BOQ:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch BOQ'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const boqId = parseInt(id)
    const data = await request.json()

    if (isNaN(boqId)) {
      return NextResponse.json({ success: false, error: 'Invalid BOQ ID' }, { status: 400 })
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    // Update all provided fields
    if (data.projectName !== undefined) updateData.projectName = data.projectName
    if (data.projectLocation !== undefined) updateData.projectLocation = data.projectLocation
    if (data.clientName !== undefined) updateData.clientName = data.clientName
    if (data.clientEmail !== undefined) updateData.clientEmail = data.clientEmail
    if (data.clientPhone !== undefined) updateData.clientPhone = data.clientPhone
    if (data.eventDate !== undefined) updateData.eventDate = data.eventDate
    if (data.duration !== undefined) updateData.duration = data.duration
    if (data.status !== undefined) updateData.status = data.status
    if (data.remarks !== undefined) updateData.remarks = data.remarks
    if (data.discount !== undefined) updateData.discount = data.discount
    if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms
    if (data.validityDays !== undefined) updateData.validityDays = data.validityDays
    
    // Update sections and calculated totals
    if (data.sections !== undefined) updateData.sections = data.sections
    if (data.subtotal !== undefined) updateData.subtotal = data.subtotal
    if (data.vat !== undefined) updateData.vat = data.vat
    if (data.total !== undefined) updateData.total = data.total
    if (data.internalCost !== undefined) updateData.internalCost = data.internalCost
    if (data.profitAmount !== undefined) updateData.profitAmount = data.profitAmount
    if (data.profitMargin !== undefined) updateData.profitMargin = data.profitMargin

    const boq = await prisma.bOQ.update({
      where: { id: boqId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      boq
    })
  } catch (error: any) {
    console.error('Error updating BOQ:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update BOQ'
      },
      { status: 500 }
    )
  }
}
