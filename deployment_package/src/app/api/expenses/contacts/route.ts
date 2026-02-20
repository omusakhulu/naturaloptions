import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (type) where.type = type

    const contacts = await prisma.expenseContact.findMany({
      where,
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(contacts)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching expense contacts:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts', details: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type, phone, email } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Contact name is required' }, { status: 400 })
    }

    // Upsert to avoid duplicates
    const existing = await prisma.expenseContact.findUnique({
      where: { name: name.trim() }
    })

    if (existing) {
      return NextResponse.json(existing)
    }

    const contact = await prisma.expenseContact.create({
      data: {
        name: name.trim(),
        type: type || null,
        phone: phone || null,
        email: email || null
      }
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating expense contact:', error)
    return NextResponse.json({ error: 'Failed to create contact', details: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
    }

    await prisma.expenseContact.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error deleting expense contact:', error)
    return NextResponse.json({ error: 'Failed to delete contact', details: message }, { status: 500 })
  }
}
