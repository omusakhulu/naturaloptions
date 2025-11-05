import { NextRequest, NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const email = searchParams.get('email')

    // Build query filter
    const where: any = {}

    if (status) where.status = status
    if (email) where.contactEmail = email

    // Fetch quotes from database
    const quotes = await prisma.eventTentQuote.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        quoteNumber: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        eventType: true,
        eventStartDate: true,
        eventEndDate: true,
        eventVenue: true,
        numberOfGuests: true,
        duration: true,
        tentType: true,
        structureSummary: true,
        lineItems: true,
        subtotal: true,
        vat: true,
        total: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      quotes,
      count: quotes.length
    })
  } catch (error: any) {
    console.error('Error fetching quotes:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch quotes'
      },
      { status: 500 }
    )
  }
}
