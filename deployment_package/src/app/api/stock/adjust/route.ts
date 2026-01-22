import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/config/auth'

export const runtime = 'nodejs'

/**
 * Adjust actual stock for a product
 * POST /api/stock/adjust
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { productId, quantity, reason, notes, locationId } = body

    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, quantity' },
        { status: 400 }
      )
    }

    // Get current product
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const beforeActual = product.actualStock
    const afterActual = beforeActual + quantity

    if (afterActual < 0) {
      return NextResponse.json(
        { error: 'Insufficient stock. Cannot reduce below 0.' },
        { status: 400 }
      )
    }

    // Update product stock and create movement record in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update product
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          actualStock: afterActual,
          updatedAt: new Date()
        }
      })

      // Create stock movement record
      const movement = await tx.productStockMovement.create({
        data: {
          productId,
          type: 'ADJUSTMENT',
          quantity,
          beforeActual,
          afterActual,
          beforeWebsite: product.websiteStock,
          afterWebsite: product.websiteStock,
          reference: `ADJ-${Date.now()}`,
          locationId,
          reason,
          notes,
          userId: session.user.id,
          userName: session.user.name || session.user.email
        }
      })

      // If location-specific, update inventory location
      if (locationId) {
        const inventoryLocation = await tx.inventoryLocation.findUnique({
          where: {
            productId_locationId: {
              productId,
              locationId
            }
          }
        })

        if (inventoryLocation) {
          await tx.inventoryLocation.update({
            where: {
              productId_locationId: {
                productId,
                locationId
              }
            },
            data: {
              quantity: inventoryLocation.quantity + quantity,
              lastUpdated: new Date()
            }
          })
        } else {
          // Create new inventory location record
          await tx.inventoryLocation.create({
            data: {
              productId,
              locationId,
              quantity: Math.max(0, quantity),
              lastUpdated: new Date()
            }
          })
        }
      }

      return { product: updatedProduct, movement }
    })

    return NextResponse.json({
      success: true,
      product: result.product,
      movement: result.movement,
      message: `Stock adjusted: ${quantity > 0 ? '+' : ''}${quantity}`
    })
  } catch (error: any) {
    console.error('Stock adjustment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}
