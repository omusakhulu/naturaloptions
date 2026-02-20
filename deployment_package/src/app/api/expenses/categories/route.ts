import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')

    const where: Record<string, unknown> = {}
    if (parentId) {
      where.parentId = parentId
    } else if (searchParams.has('parentId')) {
      // explicitly passed parentId=null means top-level only
      where.parentId = null
    }

    const categories = await prisma.expenseCategory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { children: { orderBy: { name: 'asc' } } }
    })

    return NextResponse.json(categories)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching expense categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories', details: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, parentId } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    // Upsert to avoid duplicates
    const existing = await prisma.expenseCategory.findFirst({
      where: { name: name.trim(), parentId: parentId || null }
    })

    if (existing) {
      return NextResponse.json(existing)
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name: name.trim(),
        parentId: parentId || null
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating expense category:', error)
    return NextResponse.json({ error: 'Failed to create category', details: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    await prisma.expenseCategory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error deleting expense category:', error)
    return NextResponse.json({ error: 'Failed to delete category', details: message }, { status: 500 })
  }
}
