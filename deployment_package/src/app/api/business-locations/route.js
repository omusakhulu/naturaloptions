import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const locations = await prisma.businessLocation.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching business locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business locations', details: error.message },
      { status: 500 }
    )
  }
}
