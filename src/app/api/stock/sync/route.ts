import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { wooClient } from '@/lib/woocommerce'

export const runtime = 'nodejs'

/**
 * Sync stock from actual to website (WooCommerce)
 * POST /api/stock/sync
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { productId, syncAll } = body

    if (!productId && !syncAll) {
      return NextResponse.json(
        { error: 'Either productId or syncAll=true is required' },
        { status: 400 }
      )
    }

    const results: any[] = []

    // Get products to sync
    const products = syncAll
      ? await prisma.product.findMany({
          where: { status: 'publish' }
        })
      : await prisma.product.findMany({
          where: { id: productId }
        })

    if (products.length === 0) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 })
    }

    // Sync each product
    for (const product of products) {
      try {
        const beforeWebsite = product.websiteStock
        const afterWebsite = product.actualStock - product.reservedStock
        const availableStock = Math.max(0, afterWebsite)

        // Update WooCommerce
        const wooResponse = await wooClient.put(`products/${product.wooId}`, {
          stock_quantity: availableStock,
          manage_stock: true,
          stock_status: availableStock > 0 ? 'instock' : 'outofstock'
        })

        if (wooResponse.status >= 200 && wooResponse.status < 300) {
          // Update local database
          await prisma.$transaction(async (tx) => {
            await tx.product.update({
              where: { id: product.id },
              data: {
                websiteStock: availableStock,
                stockQuantity: availableStock,
                stockStatus: availableStock > 0 ? 'instock' : 'outofstock',
                lastStockSync: new Date()
              }
            })

            // Create stock movement record
            await tx.productStockMovement.create({
              data: {
                productId: product.id,
                type: 'SYNC',
                quantity: 0,
                beforeActual: product.actualStock,
                afterActual: product.actualStock,
                beforeWebsite,
                afterWebsite: availableStock,
                reference: `SYNC-${Date.now()}`,
                notes: `Synced to WooCommerce: ${availableStock} units`,
                userId: session.user.id,
                userName: session.user.name || session.user.email
              }
            })
          })

          results.push({
            productId: product.id,
            name: product.name,
            success: true,
            actualStock: product.actualStock,
            websiteStock: availableStock,
            reserved: product.reservedStock
          })
        } else {
          throw new Error(`WooCommerce API returned status ${wooResponse.status}`)
        }
      } catch (error: any) {
        console.error(`Failed to sync product ${product.id}:`, error)
        results.push({
          productId: product.id,
          name: product.name,
          success: false,
          error: error.message
        })
      }

      // Rate limiting - wait 500ms between products
      if (syncAll) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: failCount === 0,
      message: `Synced ${successCount} product(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results
    })
  } catch (error: any) {
    console.error('Stock sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync stock' },
      { status: 500 }
    )
  }
}
