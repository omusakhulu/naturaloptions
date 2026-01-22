import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Get the quote
    const quote = await prisma.eventTentQuote.findUnique({
      where: {
        id
      }
    })

    if (!quote) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote not found'
        },
        { status: 404 }
      )
    }

    // Check if quote is already accepted
    if (quote.status === 'accepted') {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote has already been accepted'
        },
        { status: 400 }
      )
    }

    // Update quote status to accepted
    const updatedQuote = await prisma.eventTentQuote.update({
      where: {
        id
      },
      data: {
        status: 'accepted'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Quote accepted successfully',
      quote: {
        id: updatedQuote.id,
        quoteNumber: updatedQuote.quoteNumber,
        status: updatedQuote.status,
        total: updatedQuote.total
      }
    })
  } catch (error: any) {
    console.error('Error accepting quote:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to accept quote'
      },
      { status: 500 }
    )
  }
}
