import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const warranties = [
      { id: 1, name: '1 Month Warranty', duration: 1, durationType: 'months', description: 'Standard 1 month warranty' },
      { id: 2, name: '3 Months Warranty', duration: 3, durationType: 'months', description: 'Extended 3 months warranty' },
      { id: 3, name: '6 Months Warranty', duration: 6, durationType: 'months', description: 'Extended 6 months warranty' },
      { id: 4, name: '1 Year Warranty', duration: 1, durationType: 'years', description: 'Standard 1 year warranty' },
      { id: 5, name: '2 Years Warranty', duration: 2, durationType: 'years', description: 'Extended 2 years warranty' },
      { id: 6, name: '3 Years Warranty', duration: 3, durationType: 'years', description: 'Premium 3 years warranty' },
      { id: 7, name: '5 Years Warranty', duration: 5, durationType: 'years', description: 'Premium 5 years warranty' },
      { id: 8, name: 'Lifetime Warranty', duration: 0, durationType: 'lifetime', description: 'Lifetime warranty coverage' }
    ]

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

    if (!name || !duration || !durationType) {
      return NextResponse.json(
        { error: 'Name, duration, and duration type are required' },
        { status: 400 }
      )
    }

    const newWarranty = {
      id: Date.now(),
      name,
      duration,
      durationType,
      description: description || ''
    }

    return NextResponse.json(newWarranty)
  } catch (error) {
    console.error('Error creating warranty:', error)
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

    return NextResponse.json({ success: true, message: 'Warranty deleted successfully' })
  } catch (error) {
    console.error('Error deleting warranty:', error)
    return NextResponse.json(
      { error: 'Failed to delete warranty', details: error.message },
      { status: 500 }
    )
  }
}
