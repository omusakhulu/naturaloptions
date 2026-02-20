import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// Assign warranty to a product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, warrantyId, expiryDate, batchNumber } = body

    if (!productId || !warrantyId) {
      return NextResponse.json(
        { error: 'productId and warrantyId are required' },
        { status: 400 }
      )
    }

    const assignment = await prisma.productWarranty.upsert({
      where: {
        productId_warrantyId_batchNumber: {
          productId,
          warrantyId,
          batchNumber: batchNumber || ''
        }
      },
      create: {
        productId,
        warrantyId,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        batchNumber: batchNumber || ''
      },
      update: {
        expiryDate: expiryDate ? new Date(expiryDate) : null
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warranty: { select: { id: true, name: true, duration: true, durationType: true } }
      }
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error: any) {
    console.error('Error assigning warranty:', error)

    return NextResponse.json(
      { error: 'Failed to assign warranty', details: error.message },
      { status: 500 }
    )
  }
}

// Remove warranty assignment
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    await prisma.productWarranty.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Warranty assignment removed' })
  } catch (error: any) {
    console.error('Error removing warranty assignment:', error)

    return NextResponse.json(
      { error: 'Failed to remove assignment', details: error.message },
      { status: 500 }
    )
  }
}
