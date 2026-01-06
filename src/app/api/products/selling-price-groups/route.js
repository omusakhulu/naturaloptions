import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const priceGroups = [
      { id: 1, name: 'Retail Price', description: 'Standard retail pricing', discount: 0 },
      { id: 2, name: 'Wholesale Price', description: 'Wholesale pricing for bulk orders', discount: 15 },
      { id: 3, name: 'VIP Customer', description: 'Special pricing for VIP customers', discount: 20 },
      { id: 4, name: 'Distributor Price', description: 'Distributor pricing', discount: 25 },
      { id: 5, name: 'Employee Discount', description: 'Employee discount pricing', discount: 30 }
    ]

    return NextResponse.json(priceGroups)
  } catch (error) {
    console.error('Error fetching price groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price groups', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, description, discount } = body

    if (!name) {
      return NextResponse.json({ error: 'Price group name is required' }, { status: 400 })
    }

    const newPriceGroup = {
      id: Date.now(),
      name,
      description: description || '',
      discount: discount || 0
    }

    return NextResponse.json(newPriceGroup)
  } catch (error) {
    console.error('Error creating price group:', error)
    return NextResponse.json(
      { error: 'Failed to create price group', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, name, description, discount } = body

    if (!id) {
      return NextResponse.json({ error: 'Price group ID is required' }, { status: 400 })
    }

    const updatedPriceGroup = {
      id,
      name,
      description,
      discount
    }

    return NextResponse.json(updatedPriceGroup)
  } catch (error) {
    console.error('Error updating price group:', error)
    return NextResponse.json(
      { error: 'Failed to update price group', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Price group ID is required' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Price group deleted successfully' })
  } catch (error) {
    console.error('Error deleting price group:', error)
    return NextResponse.json(
      { error: 'Failed to delete price group', details: error.message },
      { status: 500 }
    )
  }
}
