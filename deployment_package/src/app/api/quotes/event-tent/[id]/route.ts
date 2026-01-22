import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

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

    // Parse JSON fields
    const lineItems = JSON.parse(quote.lineItems)

    return NextResponse.json({
      success: true,
      quote: {
        ...quote,
        lineItems
      }
    })
  } catch (error: any) {
    console.error('Error fetching quote:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch quote'
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()

    const quote = await prisma.eventTentQuote.update({
      where: {
        id
      },
      data: {
        status: data.status
      }
    })

    return NextResponse.json({
      success: true,
      quote
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await prisma.eventTentQuote.delete({
      where: {
        id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Quote deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting quote:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete quote'
      },
      { status: 500 }
    )
  }
}
