import { NextRequest, NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface UpdateQuoteRequest {
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  eventType: string
  eventStartDate?: string
  eventEndDate?: string
  eventVenue?: string
  numberOfGuests: number
  duration: number
  tentType: string
  structureSummary?: string
  lineItems: any[]
  subtotal: number
  vat: number
  total: number
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data: UpdateQuoteRequest = await request.json()

    // Check if quote exists
    const existingQuote = await prisma.eventTentQuote.findUnique({
      where: { id }
    })

    if (!existingQuote) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote not found'
        },
        { status: 404 }
      )
    }

    // Update quote in database
    const updatedQuote = await prisma.eventTentQuote.update({
      where: { id },
      data: {
        contactName: data.contactName || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        eventType: data.eventType,
        eventStartDate: data.eventStartDate ? new Date(data.eventStartDate) : null,
        eventEndDate: data.eventEndDate ? new Date(data.eventEndDate) : null,
        eventVenue: data.eventVenue || null,
        numberOfGuests: data.numberOfGuests,
        duration: data.duration,
        tentType: data.tentType,
        structureSummary: data.structureSummary || null,
        lineItems: JSON.stringify(data.lineItems),
        subtotal: data.subtotal,
        vat: data.vat,
        total: data.total
      }
    })

    return NextResponse.json({
      success: true,
      quote: {
        id: updatedQuote.id,
        quoteNumber: updatedQuote.quoteNumber,
        updatedAt: updatedQuote.updatedAt
      }
    })
  } catch (error: any) {
    console.error('Error updating quote:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update quote'
      },
      { status: 500 }
    )
  }
}
