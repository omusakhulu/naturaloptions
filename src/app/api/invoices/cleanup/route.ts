import { NextRequest, NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Delete all invoices to clear dummy data
    const result = await prisma.invoice.deleteMany({})

    console.log(`✅ Deleted ${result.count} dummy invoices`)

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} dummy invoices`,
      deletedCount: result.count
    })
  } catch (error) {
    console.error('Error cleaning up invoices:', error)

    return NextResponse.json(
      {
        error: 'Failed to clean up invoices',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
