import { NextRequest, NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}

    if (status) where.status = status

    const boqs = await prisma.bOQ.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        boqNumber: true,
        projectName: true,
        projectLocation: true,
        clientName: true,
        clientEmail: true,
        eventDate: true,
        duration: true,
        subtotal: true,
        vat: true,
        total: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        quoteId: true
      }
    })

    return NextResponse.json({
      success: true,
      boqs,
      count: boqs.length
    })
  } catch (error: any) {
    console.error('Error fetching BOQs:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch BOQs'
      },
      { status: 500 }
    )
  }
}
