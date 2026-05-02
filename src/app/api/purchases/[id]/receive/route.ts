import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { prisma } from '@/lib/prisma'
import { authOptions } from '@/config/auth'
import { apiLogger } from '@/lib/logger'

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReceiveItem {
  itemId: string
  quantity: number
  batchNumber?: string | null
  lotNumber?: string | null
  expiryDate?: string | null
}

interface ReceiveBody {
  locationId: string
  items: ReceiveItem[]
  notes?: string
}

// ---------------------------------------------------------------------------
// POST /api/purchases/[id]/receive
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: purchaseOrderId } = await params

  // -- Auth ----------------------------------------------------------------
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // -- Parse body ----------------------------------------------------------
  let body: ReceiveBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { locationId, items, notes } = body

  // -- Basic validation ----------------------------------------------------
  if (!locationId || typeof locationId !== 'string' || !locationId.trim()) {
    return NextResponse.json({ success: false, error: 'locationId is required' }, { status: 400 })
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { success: false, error: 'items array is required and must not be empty' },
      { status: 400 }
    )
  }

  // Validate each receive item has the mandatory fields
  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    if (!item.itemId || typeof item.itemId !== 'string') {
      return NextResponse.json({ success: false, error: `items[${i}].itemId is required` }, { status: 400 })
    }

    const qty = Number(item.quantity)

    if (!Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json(
        { success: false, error: `items[${i}].quantity must be a positive integer` },
        { status: 400 }
      )
    }
  }

  // -- Fetch PO with items -------------------------------------------------
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { items: true }
  })

  if (!purchaseOrder) {
    return NextResponse.json({ success: false, error: 'Purchase order not found' }, { status: 404 })
  }

  if (purchaseOrder.status === 'CANCELLED') {
    return NextResponse.json(
      { success: false, error: 'Cannot receive goods for a cancelled purchase order' },
      { status: 400 }
    )
  }

  if (purchaseOrder.status === 'RECEIVED') {
    return NextResponse.json(
      { success: false, error: 'Purchase order has already been fully received' },
      { status: 400 }
    )
  }

  // -- Verify location exists ---------------------------------------------
  const location = await prisma.location.findUnique({
    where: { id: locationId }
  })

  if (!location) {
    return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 })
  }

  // -- Build a map of PO items keyed by id for O(1) lookup ----------------
  const poItemMap = new Map(purchaseOrder.items.map(item => [item.id, item]))

  // Pre-validate all receive items before starting the transaction so we
  // fail fast with a clear message rather than aborting a partially applied tx.
  for (const receiveItem of items) {
    const poItem = poItemMap.get(receiveItem.itemId)

    if (!poItem) {
      return NextResponse.json(
        {
          success: false,
          error: `Item ${receiveItem.itemId} does not belong to purchase order ${purchaseOrderId}`
        },
        { status: 400 }
      )
    }

    const remainingQty = poItem.quantity - poItem.receivedQty
    const qty = Number(receiveItem.quantity)

    if (qty > remainingQty) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Cannot over-receive item "${poItem.productName}" (SKU: ${poItem.sku}). ` +
            `Ordered: ${poItem.quantity}, already received: ${poItem.receivedQty}, ` +
            `remaining: ${remainingQty}, attempted: ${qty}`
        },
        { status: 400 }
      )
    }
  }

  // -- Transaction ---------------------------------------------------------
  try {
    const result = await prisma.$transaction(async tx => {
      const movements: Array<{
        productId: string
        sku: string
        quantity: number
        movementId: string
      }> = []

      const receivedItems: Array<{
        itemId: string
        receivedQty: number
        totalOrdered: number
      }> = []

      for (const receiveItem of items) {
        const poItem = poItemMap.get(receiveItem.itemId)!
        const qty = Number(receiveItem.quantity)

        // 1. Find product by SKU
        const product = await tx.product.findFirst({
          where: { sku: poItem.sku }
        })

        if (!product) {
          throw new Error(
            `Product with SKU "${poItem.sku}" not found. ` +
              'Ensure the product exists in the catalogue before receiving goods.'
          )
        }

        // 2. Resolve batch / lot / expiry — prefer values from the receive
        //    request, fall back to what was recorded on the PO item.
        const batchNumber: string = receiveItem.batchNumber ?? poItem.batchNumber ?? ''

        const lotNumber: string | null = receiveItem.lotNumber ?? poItem.lotNumber ?? null

        const expiryDate: Date | null = (() => {
          const raw = receiveItem.expiryDate ?? poItem.expiryDate

          if (!raw) return null
          if (raw instanceof Date) return raw
          const parsed = new Date(raw as string)

          return isNaN(parsed.getTime()) ? null : parsed
        })()

        // 3. Update Product.actualStock (increment by qty)
        const beforeActual = product.actualStock
        const afterActual = beforeActual + qty

        await tx.product.update({
          where: { id: product.id },
          data: { actualStock: afterActual, updatedAt: new Date() }
        })

        // 4. Upsert InventoryLocation keyed by productId_locationId_batchNumber
        const existingInvLoc = await tx.inventoryLocation.findUnique({
          where: {
            productId_locationId_batchNumber: {
              productId: product.id,
              locationId,
              batchNumber
            }
          }
        })

        if (existingInvLoc) {
          await tx.inventoryLocation.update({
            where: {
              productId_locationId_batchNumber: {
                productId: product.id,
                locationId,
                batchNumber
              }
            },
            data: {
              quantity: existingInvLoc.quantity + qty,
              lotNumber: lotNumber ?? existingInvLoc.lotNumber,
              expiryDate: expiryDate ?? existingInvLoc.expiryDate,
              lastUpdated: new Date()
            }
          })
        } else {
          await tx.inventoryLocation.create({
            data: {
              productId: product.id,
              locationId,
              quantity: qty,
              batchNumber,
              lotNumber,
              expiryDate,
              lastUpdated: new Date()
            }
          })
        }

        // 5. Build movement notes
        let movementNotes: string | undefined

        if (batchNumber) {
          movementNotes = `Batch: ${batchNumber}${lotNumber ? ', Lot: ' + lotNumber : ''}`
        } else if (notes) {
          movementNotes = notes
        }

        // 6. Create ProductStockMovement
        const movement = await tx.productStockMovement.create({
          data: {
            productId: product.id,
            type: 'PURCHASE',
            quantity: qty,
            beforeActual,
            afterActual,
            beforeWebsite: product.websiteStock,
            afterWebsite: product.websiteStock,
            reference: `PO-${purchaseOrder.orderNumber}`,
            locationId,
            reason: 'Purchase order goods received',
            notes: movementNotes,
            userId: (session.user as any).id,
            userName: session.user.name || session.user.email
          }
        })

        // 7. Update PurchaseOrderItem.receivedQty
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { receivedQty: { increment: qty } }
        })

        movements.push({
          productId: product.id,
          sku: product.sku ?? poItem.sku,
          quantity: qty,
          movementId: movement.id
        })

        receivedItems.push({
          itemId: poItem.id,
          receivedQty: poItem.receivedQty + qty,
          totalOrdered: poItem.quantity
        })
      }

      // -- Determine new PO status ----------------------------------------
      // Re-query updated items to get accurate receivedQty totals.
      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId }
      })

      const allFullyReceived = updatedItems.every(i => i.receivedQty >= i.quantity)
      const anyPartiallyReceived = updatedItems.some(i => i.receivedQty > 0)

      const newStatus: string = allFullyReceived
        ? 'RECEIVED'
        : anyPartiallyReceived
          ? 'PARTIALLY_RECEIVED'
          : purchaseOrder.status

      const updatedPurchaseOrder = await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          status: newStatus as any,
          locationId,
          receivedDate: allFullyReceived ? new Date() : undefined,
          updatedAt: new Date()
        },
        include: {
          vendor: {
            select: { id: true, name: true, email: true, phone: true }
          },
          items: true
        }
      })

      return { purchaseOrder: updatedPurchaseOrder, movements, receivedItems }
    })

    apiLogger.info('Purchase order goods received', {
      purchaseOrderId,
      orderNumber: purchaseOrder.orderNumber,
      locationId,
      itemCount: items.length,
      userId: (session.user as any).id,
      newStatus: result.purchaseOrder.status
    })

    return NextResponse.json({ success: true, data: result }, { status: 200 })
  } catch (error: any) {
    apiLogger.error('Failed to receive purchase order goods', {
      purchaseOrderId,
      locationId,
      error: error.message,
      stack: error.stack
    })

    // Surface domain errors (over-receive, missing product) as 400 rather than 500
    const isDomainError = error.message?.includes('Product with SKU') || error.message?.includes('Cannot over-receive')

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to receive goods' },
      { status: isDomainError ? 400 : 500 }
    )
  }
}
