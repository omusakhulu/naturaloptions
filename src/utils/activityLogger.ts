import { EntityType } from '@prisma/client'

import prisma from '@/lib/prisma'

interface ActivityLogParams {
  performedById: string
  relatedUserId?: string
  entityType: string
  entityId: string
  action: string
  description: string
  icon?: string
  color?: string
  metadata?: Record<string, any>
}

/**
 * Create an activity log entry
 */
export async function logActivity(params: ActivityLogParams) {
  try {
    const activity = await prisma.activityLog.create({
      data: {
        performedBy: { connect: { id: params.performedById } },
        ...(params.relatedUserId ? { relatedUser: { connect: { id: params.relatedUserId } } } : {}),
        entityType: params.entityType as EntityType,
        entityId: String(params.entityId),
        action: String(params.action),
        description: String(params.description),
        icon: params.icon || null,
        color: params.color || 'primary',
        metadata: params.metadata ? JSON.stringify(params.metadata) : '{}'
      }
    })

    return activity
  } catch (error) {
    console.error('Error logging activity:', error)
    return null
  }
}

/**
 * Log invoice-related activities
 */
export async function logInvoiceActivity(
  performedById: string,
  invoiceId: string,
  action: 'created' | 'updated' | 'sent' | 'paid' | 'deleted',
  invoiceNumber: string,
  metadata?: Record<string, any>
) {
  const descriptions = {
    created: `Created invoice ${invoiceNumber}`,
    updated: `Updated invoice ${invoiceNumber}`,
    sent: `Sent invoice ${invoiceNumber} to customer`,
    paid: `Marked invoice ${invoiceNumber} as paid`,
    deleted: `Deleted invoice ${invoiceNumber}`
  }

  const icons = {
    created: 'tabler-file-plus',
    updated: 'tabler-file-pencil',
    sent: 'tabler-send',
    paid: 'tabler-check-circle',
    deleted: 'tabler-trash'
  }

  const colors = {
    created: 'success',
    updated: 'info',
    sent: 'primary',
    paid: 'success',
    deleted: 'error'
  }

  return await logActivity({
    performedById,
    entityType: 'INVOICE',
    entityId: invoiceId,
    action,
    description: descriptions[action],
    icon: icons[action],
    color: colors[action],
    metadata
  })
}

/**
 * Log order-related activities
 */
export async function logOrderActivity(
  performedById: string,
  orderId: string,
  action: 'created' | 'updated' | 'completed' | 'cancelled' | 'refunded',
  orderNumber: string,
  metadata?: Record<string, any>
) {
  const descriptions = {
    created: `Created order #${orderNumber}`,
    updated: `Updated order #${orderNumber}`,
    completed: `Completed order #${orderNumber}`,
    cancelled: `Cancelled order #${orderNumber}`,
    refunded: `Refunded order #${orderNumber}`
  }

  const icons = {
    created: 'tabler-shopping-cart-plus',
    updated: 'tabler-shopping-cart-cog',
    completed: 'tabler-shopping-cart-check',
    cancelled: 'tabler-shopping-cart-x',
    refunded: 'tabler-shopping-cart-cancel'
  }

  const colors = {
    created: 'success',
    updated: 'info',
    completed: 'success',
    cancelled: 'warning',
    refunded: 'error'
  }

  return await logActivity({
    performedById,
    entityType: 'ORDER',
    entityId: orderId,
    action,
    description: descriptions[action],
    icon: icons[action],
    color: colors[action],
    metadata
  })
}

/**
 * Log user-related activities
 */
export async function logUserActivity(
  performedById: string,
  userId: string,
  action: 'created' | 'updated' | 'role_changed' | 'activated' | 'deactivated' | 'deleted',
  userName: string,
  metadata?: Record<string, any>
) {
  const descriptions = {
    created: `Created user account for ${userName}`,
    updated: `Updated user profile for ${userName}`,
    role_changed: `Changed role for ${userName}`,
    activated: `Activated user account for ${userName}`,
    deactivated: `Deactivated user account for ${userName}`,
    deleted: `Deleted user account for ${userName}`
  }

  const icons = {
    created: 'tabler-user-plus',
    updated: 'tabler-user-cog',
    role_changed: 'tabler-user-shield',
    activated: 'tabler-user-check',
    deactivated: 'tabler-user-cancel',
    deleted: 'tabler-user-x'
  }

  const colors = {
    created: 'success',
    updated: 'info',
    role_changed: 'warning',
    activated: 'success',
    deactivated: 'warning',
    deleted: 'error'
  }

  return await logActivity({
    performedById,
    relatedUserId: userId,
    entityType: 'USER',
    entityId: userId,
    action,
    description: descriptions[action],
    icon: icons[action],
    color: colors[action],
    metadata
  })
}

/**
 * Log warehouse-related activities
 */
export async function logWarehouseActivity(
  performedById: string,
  warehouseId: string,
  action: 'stock_added' | 'stock_removed' | 'stock_adjusted' | 'inventory_updated',
  description: string,
  metadata?: Record<string, any>
) {
  const icons = {
    stock_added: 'tabler-package-import',
    stock_removed: 'tabler-package-export',
    stock_adjusted: 'tabler-adjustments',
    inventory_updated: 'tabler-clipboard-check'
  }

  const colors = {
    stock_added: 'success',
    stock_removed: 'warning',
    stock_adjusted: 'info',
    inventory_updated: 'primary'
  }

  return await logActivity({
    performedById,
    entityType: 'WAREHOUSE',
    entityId: warehouseId,
    action,
    description,
    icon: icons[action],
    color: colors[action],
    metadata
  })
}

/**
 * Log packing slip activities
 */
export async function logPackingSlipActivity(
  performedById: string,
  packingSlipId: string,
  action: 'created' | 'assigned' | 'status_updated' | 'collected' | 'delivered',
  packingSlipNumber: string,
  metadata?: Record<string, any>
) {
  const descriptions = {
    created: `Created packing slip ${packingSlipNumber}`,
    assigned: `Assigned packing slip ${packingSlipNumber}`,
    status_updated: `Updated status for packing slip ${packingSlipNumber}`,
    collected: `Marked packing slip ${packingSlipNumber} as collected`,
    delivered: `Marked packing slip ${packingSlipNumber} as delivered`
  }

  const icons = {
    created: 'tabler-package',
    assigned: 'tabler-user-check',
    status_updated: 'tabler-refresh',
    collected: 'tabler-check',
    delivered: 'tabler-truck-delivery'
  }

  const colors = {
    created: 'success',
    assigned: 'info',
    status_updated: 'primary',
    collected: 'success',
    delivered: 'success'
  }

  return await logActivity({
    performedById,
    entityType: 'PACKING_SLIP',
    entityId: packingSlipId,
    action,
    description: descriptions[action],
    icon: icons[action],
    color: colors[action],
    metadata
  })
}

/**
 * Log project/BOQ activities
 */
export async function logProjectActivity(
  performedById: string,
  projectId: string,
  action: 'created' | 'updated' | 'submitted' | 'approved' | 'completed',
  projectName: string,
  entityType: 'PROJECT' | 'BOQ' = 'PROJECT',
  metadata?: Record<string, any>
) {
  const descriptions = {
    created: `Created ${entityType.toLowerCase()} ${projectName}`,
    updated: `Updated ${entityType.toLowerCase()} ${projectName}`,
    submitted: `Submitted ${entityType.toLowerCase()} ${projectName}`,
    approved: `Approved ${entityType.toLowerCase()} ${projectName}`,
    completed: `Completed ${entityType.toLowerCase()} ${projectName}`
  }

  const icons = {
    created: 'tabler-file-plus',
    updated: 'tabler-file-pencil',
    submitted: 'tabler-send',
    approved: 'tabler-circle-check',
    completed: 'tabler-check'
  }

  const colors = {
    created: 'success',
    updated: 'info',
    submitted: 'primary',
    approved: 'success',
    completed: 'success'
  }

  return await logActivity({
    performedById,
    entityType,
    entityId: projectId,
    action,
    description: descriptions[action],
    icon: icons[action],
    color: colors[action],
    metadata
  })
}
