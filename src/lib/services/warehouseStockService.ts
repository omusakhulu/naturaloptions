import { PrismaClient, StockMovement } from '@prisma/client'

const prisma = new PrismaClient()

interface OrderLineItem {
  id: number
  name: string
  product_id: number
  variation_id: number
  quantity: number
  sku: string
  price: number
  total: string
}

interface ProcessOrderResult {
  success: boolean
  processedItems: number
  skippedItems: number
  movements: StockMovement[]
  errors: string[]
}

/**
 * Process order completion and reduce warehouse stock
 * Creates outbound stock movements for each order line item
 */
export async function processOrderCompletion(
  orderId: number,
  orderNumber: string,
  lineItems: OrderLineItem[]
): Promise<ProcessOrderResult> {
  const result: ProcessOrderResult = {
    success: true,
    processedItems: 0,
    skippedItems: 0,
    movements: [],
    errors: []
  }

  console.log(`📦 Processing order ${orderNumber} for warehouse stock reduction`)

  try {
    // Get default/primary warehouse (you may want to modify this logic)
    const warehouse = await prisma.warehouse.findFirst({
      where: { status: 'active' },
      orderBy: { createdAt: 'asc' } // Gets the first created warehouse
    })

    if (!warehouse) {
      result.errors.push('No active warehouse found')
      result.success = false
      return result
    }

    console.log(`Using warehouse: ${warehouse.name} (${warehouse.code})`)

    // Process each line item
    for (const item of lineItems) {
      try {
        if (!item.sku) {
          console.warn(`⚠️ Line item ${item.name} has no SKU, skipping`)
          result.skippedItems++
          continue
        }

        // Find inventory item by SKU in the warehouse
        const inventoryItem = await prisma.inventoryItem.findFirst({
          where: {
            warehouseId: warehouse.id,
            sku: item.sku
          }
        })

        if (!inventoryItem) {
          console.warn(`⚠️ SKU ${item.sku} not found in warehouse inventory, skipping`)
          result.skippedItems++
          result.errors.push(`SKU ${item.sku} (${item.name}) not found in warehouse`)
          continue
        }

        // Check if sufficient stock is available
        if (inventoryItem.quantity < item.quantity) {
          console.warn(
            `⚠️ Insufficient stock for ${item.sku}: available=${inventoryItem.quantity}, needed=${item.quantity}`
          )
          result.errors.push(
            `Insufficient stock for ${item.sku} (${item.name}): available=${inventoryItem.quantity}, needed=${item.quantity}`
          )
          // Continue processing even if insufficient stock (creates negative inventory)
        }

        // Calculate new quantity
        const newQuantity = inventoryItem.quantity - item.quantity

        // Create stock movement and update inventory in transaction
        const [movement] = await prisma.$transaction([
          prisma.stockMovement.create({
            data: {
              warehouseId: warehouse.id,
              inventoryId: inventoryItem.id,
              type: 'outbound',
              quantity: item.quantity,
              referenceNumber: `ORDER-${orderNumber}`,
              notes: `Order #${orderNumber} - ${item.name}`,
              performedBy: 'system'
            }
          }),
          prisma.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: { quantity: newQuantity }
          })
        ])

        console.log(
          `✅ Reduced stock for ${item.sku}: ${inventoryItem.quantity} → ${newQuantity} (-${item.quantity})`
        )

        result.movements.push(movement)
        result.processedItems++
      } catch (itemError) {
        console.error(`Error processing line item ${item.sku}:`, itemError)
        result.errors.push(`Error processing ${item.sku}: ${(itemError as Error).message}`)
        result.skippedItems++
      }
    }

    console.log(
      `✅ Order ${orderNumber} processing complete: ${result.processedItems} items processed, ${result.skippedItems} skipped`
    )

    return result
  } catch (error) {
    console.error('Error processing order for warehouse stock:', error)
    result.success = false
    result.errors.push((error as Error).message)
    return result
  }
}

/**
 * Get warehouse stock movements for a specific order
 */
export async function getOrderStockMovements(orderNumber: string) {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: {
        referenceNumber: `ORDER-${orderNumber}`
      },
      include: {
        inventory: {
          select: {
            sku: true,
            productName: true,
            quantity: true
          }
        },
        warehouse: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return movements
  } catch (error) {
    console.error('Error fetching order stock movements:', error)
    return []
  }
}

/**
 * Reverse stock movements for an order (in case of cancellation/refund)
 */
export async function reverseOrderStockMovements(orderNumber: string): Promise<ProcessOrderResult> {
  const result: ProcessOrderResult = {
    success: true,
    processedItems: 0,
    skippedItems: 0,
    movements: [],
    errors: []
  }

  try {
    // Find all outbound movements for this order
    const originalMovements = await prisma.stockMovement.findMany({
      where: {
        referenceNumber: `ORDER-${orderNumber}`,
        type: 'outbound'
      },
      include: {
        inventory: true,
        warehouse: true
      }
    })

    if (originalMovements.length === 0) {
      result.errors.push('No stock movements found for this order')
      return result
    }

    // Create return movements to reverse the outbound movements
    for (const movement of originalMovements) {
      try {
        const newQuantity = movement.inventory.quantity + movement.quantity

        const [returnMovement] = await prisma.$transaction([
          prisma.stockMovement.create({
            data: {
              warehouseId: movement.warehouseId,
              inventoryId: movement.inventoryId,
              type: 'return',
              quantity: movement.quantity,
              referenceNumber: `RETURN-${orderNumber}`,
              notes: `Returned from cancelled/refunded order #${orderNumber}`,
              performedBy: 'system'
            }
          }),
          prisma.inventoryItem.update({
            where: { id: movement.inventoryId },
            data: { quantity: newQuantity }
          })
        ])

        console.log(
          `✅ Returned stock for ${movement.inventory.sku}: ${movement.inventory.quantity} → ${newQuantity} (+${movement.quantity})`
        )

        result.movements.push(returnMovement)
        result.processedItems++
      } catch (itemError) {
        console.error(`Error reversing movement ${movement.id}:`, itemError)
        result.errors.push(`Error reversing movement: ${(itemError as Error).message}`)
        result.skippedItems++
      }
    }

    console.log(
      `✅ Order ${orderNumber} reversal complete: ${result.processedItems} items returned, ${result.skippedItems} skipped`
    )

    return result
  } catch (error) {
    console.error('Error reversing order stock movements:', error)
    result.success = false
    result.errors.push((error as Error).message)
    return result
  }
}
