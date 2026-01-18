import { prisma } from '@/lib/prisma'

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL environment variable is not set. Invoices will not be saved to database.')
}

/**
 * Upsert invoice by Woo Order ID
 */
export async function upsertInvoiceByOrderId(orderId: number, data: InvoiceData) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping invoice upsert: DATABASE_URL not configured')

    return null
  }

  try {
    const invoice = await prisma.invoice.upsert({
      where: { wooOrderId: orderId },
      update: {
        invoiceNumber: data.invoiceNumber,
        customerId: data.customerId,
        status: data.status,
        ...(data.orderStatus ? { orderStatus: data.orderStatus } : {}),
        amount: data.amount,
        date: data.date,
        dueDate: data.dueDate,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        billingAddress: data.billingAddress ? JSON.stringify(data.billingAddress) : undefined,
        lineItems: data.lineItems ? JSON.stringify(data.lineItems) : undefined
      },
      create: {
        wooOrderId: orderId,
        invoiceNumber: data.invoiceNumber,
        customerId: data.customerId,
        status: data.status,
        ...(data.orderStatus ? { orderStatus: data.orderStatus } : {}),
        amount: data.amount,
        date: data.date,
        dueDate: data.dueDate,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        billingAddress: data.billingAddress ? JSON.stringify(data.billingAddress) : undefined,
        lineItems: data.lineItems ? JSON.stringify(data.lineItems) : undefined
      }
    })

    return invoice
  } catch (error) {
    console.error('Error upserting invoice:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

/**
 * Update invoice lifecycle status by Woo Order ID
 */
export async function updateInvoiceStatusByOrderId(
  orderId: number,
  status: 'draft' | 'sent' | 'partially_paid' | 'paid'
) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping invoice update: DATABASE_URL not configured')

    return null
  }

  try {
    const invoice = await prisma.invoice.update({
      where: { wooOrderId: orderId },
      data: { status }
    })

    return invoice
  } catch (error) {
    console.error('Error updating invoice status by order:', error instanceof Error ? error.message : 'Unknown error')

    return null
  }
}

export interface InvoiceData {
  orderId: number
  invoiceNumber: string
  customerId?: number

  // Invoice lifecycle status (draft | sent | partially_paid | paid)
  status: string

  // Woo order status (pending | processing | completed | ...)
  orderStatus?: string
  amount: string
  date: Date
  dueDate?: Date
  customerName: string
  customerEmail: string
  billingAddress?: any
  lineItems?: any[]
}

/**
 * Create an invoice from an order
 */
export async function createInvoice(invoiceData: InvoiceData) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping invoice creation: DATABASE_URL not configured')

    return null
  }

  try {
    const invoice = await prisma.invoice.create({
      data: {
        wooOrderId: invoiceData.orderId,
        invoiceNumber: invoiceData.invoiceNumber,
        customerId: invoiceData.customerId,
        status: invoiceData.status,

        // Optional fields to maintain compatibility if columns exist
        ...(invoiceData.orderStatus ? { orderStatus: invoiceData.orderStatus } : {}),
        amount: invoiceData.amount,
        date: invoiceData.date,
        dueDate: invoiceData.dueDate,
        customerName: invoiceData.customerName,
        customerEmail: invoiceData.customerEmail,
        billingAddress: invoiceData.billingAddress ? JSON.stringify(invoiceData.billingAddress) : undefined,
        lineItems: invoiceData.lineItems ? JSON.stringify(invoiceData.lineItems) : undefined
      }
    })

    return invoice
  } catch (error) {
    console.error('Error creating invoice:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

/**
 * Get all invoices
 */
export async function getAllInvoices(options?: { take?: number }) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping invoices fetch: DATABASE_URL not configured')

    return []
  }

  try {
    const invoices = await prisma.invoice.findMany({
      where: { deletedAt: null },
      orderBy: { date: 'desc' },
      ...(typeof options?.take === 'number' ? { take: options.take } : {})
    })

    return invoices.map(inv => {
      const raw = inv?.amount
      const cleaned = String(raw ?? '0').replace(/[^0-9.-]/g, '')
      const n = Number.parseFloat(cleaned)

      return {
        ...inv,
        amount: Number.isFinite(n) ? String(n) : '0'
      }
    })
  } catch (error) {
    console.error('Error fetching invoices:', error instanceof Error ? error.message : 'Unknown error')

    return []
  }
}

export async function getInvoiceById(invoiceId: string) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping invoice fetch: DATABASE_URL not configured')

    return null
  }

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, deletedAt: null }
    })

    if (!invoice) return null

    const raw = invoice?.amount
    const cleaned = String(raw ?? '0').replace(/[^0-9.-]/g, '')
    const n = Number.parseFloat(cleaned)

    return {
      ...invoice,
      amount: Number.isFinite(n) ? String(n) : '0'
    }
  } catch (error) {
    console.error('Error fetching invoice by id:', error instanceof Error ? error.message : 'Unknown error')

    return null
  }
}

/**
 * Get invoices by customer ID
 */
export async function getInvoicesByCustomerId(customerId: number) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping invoices fetch: DATABASE_URL not configured')

    return []
  }

  try {
    const invoices = await prisma.invoice.findMany({
      where: { customerId, deletedAt: null },
      orderBy: { date: 'desc' }
    })

    return invoices
  } catch (error) {
    console.error('Error fetching invoices:', error instanceof Error ? error.message : 'Unknown error')

    return []
  }
}

/**
 * Get invoice by order ID
 */
export async function getInvoiceByOrderId(orderId: number) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping invoice fetch: DATABASE_URL not configured')

    return null
  }

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { wooOrderId: orderId, deletedAt: null }
    })

    return invoice
  } catch (error) {
    console.error('Error fetching invoice:', error instanceof Error ? error.message : 'Unknown error')

    return null
  }
}

export async function softDeleteInvoice(invoiceId: string) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping invoice delete: DATABASE_URL not configured')

    return null
  }

  try {
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { deletedAt: new Date() }
    })

    return invoice
  } catch (error) {
    console.error('Error soft-deleting invoice:', error instanceof Error ? error.message : 'Unknown error')

    return null
  }
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(invoiceId: string, status: string) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping invoice update: DATABASE_URL not configured')

    return null
  }

  try {
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status }
    })

    return invoice
  } catch (error) {
    console.error('Error updating invoice:', error instanceof Error ? error.message : 'Unknown error')

    return null
  }
}
