import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

interface SaveQuoteRequest {
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

export async function POST(request: NextRequest) {
  try {
    const data: SaveQuoteRequest = await request.json()

    // Generate unique quote number
    const timestamp = Date.now()
    const quoteNumber = `QTE-${timestamp}`

    // Save quote to database
    const quote = await prisma.eventTentQuote.create({
      data: {
        quoteNumber,
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
        total: data.total,
        status: 'draft'
      }
    })

    return NextResponse.json({
      success: true,
      quote: {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        createdAt: quote.createdAt
      }
    })
  } catch (error: any) {
    console.error('Error saving quote:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save quote'
      },
      { status: 500 }
    )
  }
}
