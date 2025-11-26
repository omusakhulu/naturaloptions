import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const runtime = 'nodejs'

/**
 * Reserve stock for an order (doesn't reduce actual stock, just reserves it)
 * POST /api/stock/reserve
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { productId, quantity, orderId } = body

    if (!productId || !quantity || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, quantity, orderId' },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const availableStock = product.actualStock - product.reservedStock

    if (availableStock < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}` },
        { status: 400 }
      )
    }

    // Update reserved stock
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        reservedStock: product.reservedStock + quantity
      }
    })

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: `Reserved ${quantity} units for order ${orderId}`
    })
  } catch (error: any) {
    console.error('Reserve stock error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reserve stock' },
      { status: 500 }
    )
  }
}

/**
 * Release reserved stock
 * DELETE /api/stock/reserve
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { productId, quantity, orderId } = body

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, quantity' },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Update reserved stock
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        reservedStock: Math.max(0, product.reservedStock - quantity)
      }
    })

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: `Released ${quantity} units${orderId ? ` from order ${orderId}` : ''}`
    })
  } catch (error: any) {
    console.error('Release stock error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to release stock' },
      { status: 500 }
    )
  }
}
