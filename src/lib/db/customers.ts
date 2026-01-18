import { prisma } from '@/lib/prisma'

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL environment variable is not set. Customers will not be saved to database.')
}

export interface CustomerData {
  id: number
  email?: string
  first_name?: string
  last_name?: string
  username?: string
  role?: string
  avatar_url?: string
  billing?: any
  shipping?: any
  date_created?: string
}

/**
 * Save or update a customer in the database
 */
export async function saveCustomer(customerData: CustomerData) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping customer save: DATABASE_URL not configured')

    return null
  }

  try {
    const customer = await prisma.customer.upsert({
      where: { wooId: customerData.id },
      update: {
        email: customerData.email || '',
        firstName: customerData.first_name || null,
        lastName: customerData.last_name || null,
        username: customerData.username || null,
        role: customerData.role || null,
        avatarUrl: customerData.avatar_url || null,
        billingAddress: JSON.stringify(customerData.billing || {}),
        shippingAddress: JSON.stringify(customerData.shipping || {}),
        syncedAt: new Date()
      },
      create: {
        wooId: customerData.id,
        email: customerData.email || '',
        firstName: customerData.first_name || null,
        lastName: customerData.last_name || null,
        username: customerData.username || null,
        role: customerData.role || null,
        avatarUrl: customerData.avatar_url || null,
        billingAddress: JSON.stringify(customerData.billing || {}),
        shippingAddress: JSON.stringify(customerData.shipping || {})
      }
    })

    return customer
  } catch (error) {
    console.error('Error saving customer:', error instanceof Error ? error.message : 'Unknown error')

    return null
  }
}

/**
 * Save multiple customers to the database
 */
export async function saveCustomers(customersData: CustomerData[]) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping customers save: DATABASE_URL not configured')

    return []
  }

  try {
    const results = await Promise.all(customersData.map(customer => saveCustomer(customer)))

    return results.filter(Boolean)
  } catch (error) {
    console.error('Error saving customers:', error instanceof Error ? error.message : 'Unknown error')

    return []
  }
}

/**
 * Get all customers from the database
 */
export async function getAllCustomers(options?: { take?: number }) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping customers fetch: DATABASE_URL not configured')

    return []
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      ...(typeof options?.take === 'number' ? { take: options.take } : {})
    })

    return customers
  } catch (error) {
    console.error('Error fetching customers:', error instanceof Error ? error.message : 'Unknown error')

    return []
  }
}

/**
 * Get a customer by WooCommerce ID
 */
export async function getCustomerByWooId(wooId: number) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping customer fetch: DATABASE_URL not configured')

    return null
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { wooId }
    })

    return customer
  } catch (error) {
    console.error('Error fetching customer:', error instanceof Error ? error.message : 'Unknown error')

    return null
  }
}

/**
 * Delete a customer by WooCommerce ID
 */
export async function deleteCustomer(wooId: number) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping customer delete: DATABASE_URL not configured')

    return null
  }

  try {
    const customer = await prisma.customer.delete({
      where: { wooId }
    })

    return customer
  } catch (error) {
    console.error('Error deleting customer:', error instanceof Error ? error.message : 'Unknown error')

    return null
  }
}

/**
 * Clear all customers from the database
 */
export async function clearAllCustomers() {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ Skipping customers clear: DATABASE_URL not configured')

    return 0
  }

  try {
    const result = await prisma.customer.deleteMany({})

    return result.count
  } catch (error) {
    console.error('Error clearing customers:', error instanceof Error ? error.message : 'Unknown error')

    return 0
  }
}
