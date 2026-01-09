import CustomerListTable from '@views/apps/ecommerce/customers/list/CustomerListTable'
import FetchAllCustomersButton from '@/components/customers/FetchAllCustomersButton'
import { getAllCustomers, saveCustomers } from '@/lib/db/customers'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'
import prisma from '@/lib/prisma'

async function getCustomerAggregates() {
  const byCustomerId = {}
  const byEmail = {}

  try {
    const invoices = await prisma.invoice.findMany({
      select: { customerId: true, customerEmail: true, amount: true, invoiceStatus: true, date: true }
    })

    for (const inv of invoices) {
      const keyId = inv.customerId != null ? String(inv.customerId) : undefined
      const keyEmail = (inv.customerEmail || '').toLowerCase()
      const target =
        (keyId ? byCustomerId[keyId] : null) || (keyEmail ? byEmail[keyEmail] : null) || {
          outstanding: 0,
          lastInvoice: null,
          orders: 0,
          lastOrderDate: null
        }

      if (keyId) byCustomerId[keyId] = target
      if (keyEmail) byEmail[keyEmail] = target

      const amt = typeof inv.amount === 'string' ? parseFloat(inv.amount) : Number(inv.amount || 0)
      const status = String(inv.invoiceStatus || '').toLowerCase()

      if (status && status !== 'paid') target.outstanding += Number.isFinite(amt) ? amt : 0
      const d = inv.date ? new Date(inv.date) : null

      if (d && (!target.lastInvoice || d > target.lastInvoice)) target.lastInvoice = d
    }

    const orders = await prisma.order.findMany({ select: { customerId: true, dateCreated: true } })

    for (const o of orders) {
      const keyId = o.customerId != null ? String(o.customerId) : undefined
      const target = keyId ? (byCustomerId[keyId] ||= { outstanding: 0, lastInvoice: null, orders: 0, lastOrderDate: null }) : null

      if (!target) continue
      target.orders += 1
      const d = o.dateCreated ? new Date(o.dateCreated) : null

      if (d && (!target.lastOrderDate || d > target.lastOrderDate)) target.lastOrderDate = d
    }
  } catch (e) {
    console.error('Error fetching customer aggregates:', e)
  }

  return { byCustomerId, byEmail }
}

/**
 * Fetches customers from WooCommerce API
 */
async function getWooCommerceCustomers() {
  try {
    console.log('Fetching fresh customers from WooCommerce...')
    const woo = WooCommerceService.getInstance()

    // Fetch customers with pagination
    let allCustomers = []
    let page = 1
    const perPage = 100
    let hasMore = true

    while (hasMore) {
      try {
        const customers = await woo.executeApiRequest(
          `/wp-json/wc/v3/customers?per_page=${perPage}&page=${page}`,
          'GET'
        )

        if (!Array.isArray(customers) || customers.length === 0) {
          hasMore = false
        } else {
          allCustomers = [...allCustomers, ...customers]
          console.log(`👥 Fetched ${customers.length} customers from page ${page}`)
          page++
        }
      } catch (error) {
        console.error(`Error fetching customers page ${page}:`, error)
        hasMore = false
      }
    }

    console.log(`Received ${allCustomers.length} customers from WooCommerce`)

    // Save customers to database
    try {
      await saveCustomers(allCustomers)
      console.log(`✅ Saved ${allCustomers.length} customers to database`)
    } catch (dbError) {
      console.warn(
        '⚠️ Failed to save customers to database:',
        dbError instanceof Error ? dbError.message : 'Unknown error'
      )
    }

    // Transform WooCommerce customers for display
    const transformedCustomers = allCustomers.map(customer => ({
      id: customer.id,
      email: customer.email || '',
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      username: customer.username || '',
      role: customer.role || 'customer',
      avatarUrl: customer.avatar_url || '',
      billingAddress: customer.billing || {},
      shippingAddress: customer.shipping || {},
      ordersCount:
        typeof customer.orders_count === 'number' ? customer.orders_count : Number(customer.orders_count || 0),
      totalSpent:
        typeof customer.total_spent === 'string' || typeof customer.total_spent === 'number'
          ? Number(customer.total_spent)
          : 0,
      dateCreated: customer.date_created ? new Date(customer.date_created) : null,
      _cachedAt: Date.now()
    }))

    console.log(`Transformed ${transformedCustomers.length} customers for display`)

    return transformedCustomers
  } catch (error) {
    console.error('Failed to fetch WooCommerce customers:', {
      name: error.name,
      message: error.message,
      status: error.response?.status
    })

    console.log('Falling back to database customers...')

    return []
  }
}

/**
 * Fetches customers from database
 */
async function getCustomersFromDatabase() {
  try {
    console.log('Fetching customers from database...')
    const dbCustomers = await getAllCustomers()

    if (!Array.isArray(dbCustomers) || dbCustomers.length === 0) {
      console.log('No customers found in database')

      return []
    }

    console.log(`Found ${dbCustomers.length} customers in database`)

    // Transform database customers for display
    const transformedCustomers = dbCustomers.map(customer => ({
      id: customer.wooId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      username: customer.username,
      role: customer.role,
      avatarUrl: customer.avatarUrl,
      billingAddress: customer.billingAddress ? JSON.parse(customer.billingAddress) : {},
      shippingAddress: customer.shippingAddress ? JSON.parse(customer.shippingAddress) : {},
      dateCreated: customer.createdAt,
      _cachedAt: Date.now()
    }))

    console.log(`Transformed ${transformedCustomers.length} customers for display`)

    return transformedCustomers
  } catch (error) {
    console.error('Failed to fetch customers from database:', error instanceof Error ? error.message : 'Unknown error')

    return []
  }
}

const CustomerListTablePage = async () => {
  // Try to fetch from WooCommerce first
  let customersData = await getWooCommerceCustomers()

  // If WooCommerce fails, fall back to database
  if (!customersData || customersData.length === 0) {
    console.log('No customers from WooCommerce, fetching from database...')
    customersData = await getCustomersFromDatabase()
  }

  // Merge accounting aggregates
  try {
    const aggs = await getCustomerAggregates()
    customersData = customersData.map(c => {
      const idKey = c.id != null ? String(c.id) : undefined
      const m = (idKey && aggs.byCustomerId[idKey]) || (c.email ? aggs.byEmail[(c.email || '').toLowerCase()] : null) || {}
      return {
        ...c,
        outstanding: Number(m.outstanding || 0),
        lastInvoice: m.lastInvoice || null,
        lastOrderDate: m.lastOrderDate || null
      }
    })
  } catch (e) {
    // ignore aggregates if unavailable
  }

  return (
    <>
      <div className='pli-2 plb-4'>
        <FetchAllCustomersButton />
      </div>
      <CustomerListTable customerData={customersData} />
    </>
  )
}

export default CustomerListTablePage
