import { NextResponse } from 'next/server'
import { wooClient } from '@/lib/woocommerce'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const perPage = searchParams.get('per_page') || 100

    const response = await wooClient.get('products/attributes/2/terms', {
      per_page: perPage,
      orderby: 'name',
      order: 'asc'
    })

    return NextResponse.json(response.data || [])
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brands', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, slug, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 })
    }

    const response = await wooClient.post('products/attributes/2/terms', {
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || ''
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error creating brand:', error)
    return NextResponse.json(
      { error: 'Failed to create brand', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, name, slug, description } = body

    if (!id) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    const response = await wooClient.put(`products/attributes/2/terms/${id}`, {
      name,
      slug,
      description
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error updating brand:', error)
    return NextResponse.json(
      { error: 'Failed to update brand', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 })
    }

    await wooClient.delete(`products/attributes/2/terms/${id}`, { force: true })

    return NextResponse.json({ success: true, message: 'Brand deleted successfully' })
  } catch (error) {
    console.error('Error deleting brand:', error)
    return NextResponse.json(
      { error: 'Failed to delete brand', details: error.message },
      { status: 500 }
    )
  }
}
