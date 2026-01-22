/**
 * Notification Utility
 * Helper functions to create notifications across the app
 */

/**
 * Create a notification for a user
 * @param {string} userId - User ID to send notification to
 * @param {object} notification - Notification data
 * @returns {Promise<object>} Created notification
 */
export async function createNotification(userId, notification) {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        ...notification
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create notification')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

/**
 * Create a role assignment notification
 */
export async function notifyRoleAssignment(userId, roleName, assignedBy) {
  return createNotification(userId, {
    title: `Role Updated to ${roleName}`,
    subtitle: `Your role has been changed to ${roleName} by ${assignedBy}`,
    type: 'INFO',
    avatarIcon: 'tabler-shield-check',
    avatarColor: 'info',
    link: '/apps/roles'
  })
}

/**
 * Create a staff assignment notification
 */
export async function notifyStaffAssignment(userId, assignmentType, assignmentName, assignedBy) {
  const typeConfig = {
    ecommerce: { icon: 'tabler-shopping-cart', color: 'primary', label: 'eCommerce Operations' },
    projects: { icon: 'tabler-briefcase', color: 'info', label: 'Project' },
    warehouse: { icon: 'tabler-building-warehouse', color: 'warning', label: 'Warehouse' },
    financial: { icon: 'tabler-file-invoice', color: 'success', label: 'Financial Operations' },
    customers: { icon: 'tabler-user-check', color: 'secondary', label: 'Customer' }
  }

  const config = typeConfig[assignmentType] || typeConfig.ecommerce

  return createNotification(userId, {
    title: `Assigned to ${config.label}`,
    subtitle: assignmentName 
      ? `You've been assigned to ${assignmentName} by ${assignedBy}`
      : `You've been assigned to ${config.label} by ${assignedBy}`,
    type: 'INFO',
    avatarIcon: config.icon,
    avatarColor: config.color,
    metadata: JSON.stringify({
      assignmentType,
      assignmentName,
      assignedBy
    })
  })
}

/**
 * Create an order notification
 */
export async function notifyOrderStatus(userId, orderNumber, status) {
  const statusConfig = {
    completed: { color: 'success', message: 'Order has been completed' },
    processing: { color: 'info', message: 'Order is being processed' },
    cancelled: { color: 'error', message: 'Order has been cancelled' },
    refunded: { color: 'warning', message: 'Order has been refunded' }
  }

  const config = statusConfig[status] || statusConfig.processing

  return createNotification(userId, {
    title: `Order #${orderNumber} ${status}`,
    subtitle: config.message,
    type: 'ORDER',
    avatarIcon: 'tabler-shopping-bag',
    avatarColor: config.color,
    link: `/apps/ecommerce/orders/list`,
    metadata: JSON.stringify({ orderNumber, status })
  })
}

/**
 * Create a project notification
 */
export async function notifyProject(userId, projectName, message, link = null) {
  return createNotification(userId, {
    title: `Project: ${projectName}`,
    subtitle: message,
    type: 'PROJECT',
    avatarIcon: 'tabler-briefcase',
    avatarColor: 'info',
    link: link || '/apps/projects/list',
    metadata: JSON.stringify({ projectName })
  })
}

/**
 * Create a warehouse notification
 */
export async function notifyWarehouse(userId, warehouseName, message, type = 'info') {
  return createNotification(userId, {
    title: `Warehouse: ${warehouseName}`,
    subtitle: message,
    type: 'WAREHOUSE',
    avatarIcon: 'tabler-building-warehouse',
    avatarColor: type === 'warning' ? 'warning' : 'info',
    link: '/apps/warehouses/list',
    metadata: JSON.stringify({ warehouseName })
  })
}

/**
 * Create a customer notification
 */
export async function notifyCustomer(userId, customerName, message) {
  return createNotification(userId, {
    title: `Customer: ${customerName}`,
    subtitle: message,
    type: 'CUSTOMER',
    avatarIcon: 'tabler-user-check',
    avatarColor: 'secondary',
    link: '/apps/ecommerce/customers/list',
    metadata: JSON.stringify({ customerName })
  })
}

/**
 * Create a financial notification
 */
export async function notifyFinancial(userId, title, message, type = 'INFO') {
  return createNotification(userId, {
    title,
    subtitle: message,
    type: 'FINANCIAL',
    avatarIcon: 'tabler-file-invoice',
    avatarColor: type === 'SUCCESS' ? 'success' : 'primary',
    link: '/apps/invoice/list'
  })
}

/**
 * Create a system notification
 */
export async function notifySystem(userId, title, message, type = 'INFO') {
  const typeConfig = {
    SUCCESS: { icon: 'tabler-circle-check', color: 'success' },
    WARNING: { icon: 'tabler-alert-triangle', color: 'warning' },
    ERROR: { icon: 'tabler-alert-circle', color: 'error' },
    INFO: { icon: 'tabler-info-circle', color: 'info' }
  }

  const config = typeConfig[type] || typeConfig.INFO

  return createNotification(userId, {
    title,
    subtitle: message,
    type,
    avatarIcon: config.icon,
    avatarColor: config.color
  })
}
