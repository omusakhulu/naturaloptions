import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_WARRANTIES = [
  { name: '1 Month Warranty', duration: 1, durationType: 'months', description: 'Standard 1 month warranty' },
  { name: '3 Months Warranty', duration: 3, durationType: 'months', description: 'Extended 3 months warranty' },
  { name: '6 Months Warranty', duration: 6, durationType: 'months', description: 'Extended 6 months warranty' },
  { name: '1 Year Warranty', duration: 1, durationType: 'years', description: 'Standard 1 year warranty' },
  { name: '2 Years Warranty', duration: 2, durationType: 'years', description: 'Extended 2 years warranty' },
  { name: '3 Years Warranty', duration: 3, durationType: 'years', description: 'Premium 3 years warranty' },
  { name: '5 Years Warranty', duration: 5, durationType: 'years', description: 'Premium 5 years warranty' },
  { name: 'Lifetime Warranty', duration: 0, durationType: 'lifetime', description: 'Lifetime warranty coverage' }
]

export async function GET() {
  try {
    // Seed defaults if table is empty
    const count = await prisma.warranty.count()

    if (count === 0) {
      await prisma.warranty.createMany({ data: DEFAULT_WARRANTIES })
    }

    const warranties = await prisma.warranty.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { products: true } } }
    })

    return NextResponse.json(warranties)
  } catch (error) {
    console.error('Error fetching warranties:', error)

    return NextResponse.json(
      { error: 'Failed to fetch warranties', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, duration, durationType, description } = body

    if (!name || duration == null || !durationType) {
      return NextResponse.json(
        { error: 'Name, duration, and duration type are required' },
        { status: 400 }
      )
    }

    const warranty = await prisma.warranty.create({
      data: {
        name,
        duration: parseInt(duration, 10),
        durationType,
        description: description || ''
      }
    })

    return NextResponse.json(warranty, { status: 201 })
  } catch (error) {
    console.error('Error creating warranty:', error)

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A warranty with that name already exists' }, { status: 409 })
    }

    return NextResponse.json(
      { error: 'Failed to create warranty', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Warranty ID is required' }, { status: 400 })
    }

    await prisma.warranty.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Warranty deleted successfully' })
  } catch (error) {
    console.error('Error deleting warranty:', error)

    return NextResponse.json(
      { error: 'Failed to delete warranty', details: error.message },
      { status: 500 }
    )
  }
}
