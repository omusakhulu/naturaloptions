import { NextResponse } from 'next/server'
import { wooClient } from '@/lib/woocommerce'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const perPage = searchParams.get('per_page') || 100

    const response = await wooClient.get('products/categories', {
      per_page: perPage,
      orderby: 'name',
      order: 'asc'
    })

    return NextResponse.json(response.data || [])
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, slug, description, parent } = body

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const response = await wooClient.post('products/categories', {
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || '',
      parent: parent || 0
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, name, slug, description, parent } = body

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const response = await wooClient.put(`products/categories/${id}`, {
      name,
      slug,
      description,
      parent
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    await wooClient.delete(`products/categories/${id}`, { force: true })

    return NextResponse.json({ success: true, message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category', details: error.message },
      { status: 500 }
    )
  }
}
