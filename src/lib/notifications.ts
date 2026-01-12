import { prisma } from '@/lib/prisma'

type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ORDER' | 'LOW_STOCK' | 'PAYMENT' | 'SHIPMENT' | 'SYSTEM'

interface CreateNotificationParams {
  userId: string
  title: string
  subtitle?: string
  message?: string
  type?: NotificationType
  avatarIcon?: string
  avatarColor?: string
  avatarImage?: string
  link?: string
  metadata?: Record<string, any>
  sendEmail?: boolean
  expiresAt?: Date
}

interface NotifyUsersParams extends Omit<CreateNotificationParams, 'userId'> {
  userIds?: string[]
  roles?: string[]
  all?: boolean
}

/**
 * Create a notification for a single user
 */
export async function createNotification(params: CreateNotificationParams) {
  const {
    userId,
    title,
    subtitle,
    message,
    type = 'INFO',
    avatarIcon = 'tabler-bell',
    avatarColor = 'primary',
    avatarImage,
    link,
    metadata,
    sendEmail = false,
    expiresAt
  } = params

  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      subtitle,
      message,
      type,
      avatarIcon,
      avatarColor,
      avatarImage,
      link,
      metadata: metadata ? JSON.stringify(metadata) : '{}',
      expiresAt
    }
  })

  // Send email notification if requested
  if (sendEmail) {
    await sendEmailNotification(userId, title, message || subtitle || '')
  }

  return notification
}

/**
 * Notify multiple users based on IDs, roles, or all users
 */
export async function notifyUsers(params: NotifyUsersParams) {
  const { userIds, roles, all, ...notificationParams } = params
  
  let targetUserIds: string[] = []

  if (all) {
    const users = await prisma.user.findMany({
      where: { active: true },
      select: { id: true }
    })
    targetUserIds = users.map(u => u.id)
  } else if (roles && roles.length > 0) {
    const users = await prisma.user.findMany({
      where: { 
        active: true,
        role: { in: roles as any }
      },
      select: { id: true }
    })
    targetUserIds = users.map(u => u.id)
  } else if (userIds) {
    targetUserIds = userIds
  }

  const notifications = await Promise.all(
    targetUserIds.map(userId => 
      createNotification({ ...notificationParams, userId })
    )
  )

  return notifications
}

/**
 * Create a low stock alert notification
 */
export async function createLowStockAlert(product: {
  id: string
  name: string
  sku?: string | null
  actualStock: number
  lowStockAlert: number
}) {
  // Notify all managers and admins
  await notifyUsers({
    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    title: 'Low Stock Alert',
    subtitle: `${product.name} is running low`,
    message: `Product ${product.sku ? `(${product.sku})` : ''} has only ${product.actualStock} units remaining (threshold: ${product.lowStockAlert})`,
    type: 'LOW_STOCK',
    avatarIcon: 'tabler-alert-triangle',
    avatarColor: 'warning',
    link: `/inventory/products/${product.id}`,
    metadata: {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      currentStock: product.actualStock,
      threshold: product.lowStockAlert
    },
    sendEmail: true
  })
}

/**
 * Create a new order notification
 */
export async function createNewOrderNotification(order: {
  id: string
  orderNumber: string
  total: string
  customerName?: string
}) {
  await notifyUsers({
    roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES'],
    title: 'New Order Received',
    subtitle: `Order #${order.orderNumber}`,
    message: `New order from ${order.customerName || 'Customer'} for ${order.total}`,
    type: 'ORDER',
    avatarIcon: 'tabler-shopping-cart',
    avatarColor: 'success',
    link: `/orders/${order.id}`,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      customerName: order.customerName
    },
    sendEmail: false // Optional: set to true for email alerts
  })
}

/**
 * Create a payment received notification
 */
export async function createPaymentNotification(payment: {
  orderId: string
  orderNumber: string
  amount: string
  method: string
}) {
  await notifyUsers({
    roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
    title: 'Payment Received',
    subtitle: `Order #${payment.orderNumber}`,
    message: `Payment of ${payment.amount} received via ${payment.method}`,
    type: 'PAYMENT',
    avatarIcon: 'tabler-credit-card',
    avatarColor: 'success',
    link: `/orders/${payment.orderId}`,
    metadata: payment
  })
}

/**
 * Send email notification (stub - implement with your email provider)
 */
async function sendEmailNotification(
  userId: string,
  subject: string,
  body: string
): Promise<boolean> {
  try {
    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    })

    if (!user?.email) {
      console.warn(`No email found for user ${userId}`)
      return false
    }

    // Check if email service is configured
    const emailServiceConfigured = !!(
      process.env.SMTP_HOST || 
      process.env.RESEND_API_KEY || 
      process.env.SENDGRID_API_KEY
    )

    if (!emailServiceConfigured) {
      console.log(`Email notification skipped (no email service configured): ${subject}`)
      return false
    }

    // Implementation depends on your email provider
    // Example with Resend:
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'noreply@naturaloptions.co.ke',
          to: user.email,
          subject: `[Natural Options] ${subject}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">${subject}</h2>
              <p style="color: #666; line-height: 1.6;">${body}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #999; font-size: 12px;">
                This is an automated notification from Natural Options.
              </p>
            </div>
          `
        })
      })

      if (response.ok) {
        // Update notification with email sent status
        await prisma.notification.updateMany({
          where: { userId, title: subject },
          data: { emailSent: true, emailSentAt: new Date() }
        })
        return true
      }
    }

    // Example with SendGrid:
    if (process.env.SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: user.email }] }],
          from: { email: process.env.EMAIL_FROM || 'noreply@naturaloptions.co.ke' },
          subject: `[Natural Options] ${subject}`,
          content: [{ type: 'text/html', value: `<p>${body}</p>` }]
        })
      })

      if (response.ok) {
        await prisma.notification.updateMany({
          where: { userId, title: subject },
          data: { emailSent: true, emailSentAt: new Date() }
        })
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error sending email notification:', error)
    return false
  }
}

/**
 * Clean up expired notifications
 */
export async function cleanupExpiredNotifications(): Promise<number> {
  const result = await prisma.notification.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  })
  return result.count
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false }
  })
}
