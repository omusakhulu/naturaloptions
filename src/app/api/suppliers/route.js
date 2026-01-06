import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const suppliers = await prisma.vendor.findMany({
      where: { isActive: true },
      include: {
        paymentTerm: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    
    const supplier = await prisma.vendor.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        shippingAddress: data.shippingAddress || null,
        paymentTermId: data.paymentTermId || null,
        profile: data.profile || '{}',
        isActive: true
      }
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    const supplier = await prisma.vendor.update({
      where: { id },
      data: {
        name: updateData.name,
        email: updateData.email || null,
        phone: updateData.phone || null,
        address: updateData.address || null,
        shippingAddress: updateData.shippingAddress || null,
        paymentTermId: updateData.paymentTermId || null,
        profile: updateData.profile || '{}',
        isActive: updateData.isActive !== undefined ? updateData.isActive : true
      }
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    await prisma.vendor.update({
      where: { id },
      data: { isActive: false }
    })
    
    return NextResponse.json({ success: true, message: 'Supplier deactivated successfully' })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplier', details: error.message },
      { status: 500 }
    )
  }
}
