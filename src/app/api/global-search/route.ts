import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import searchData from '@/data/naturalOptionsSearchData'

interface SearchResult {
  type: string
  id: string
  title: string
  subtitle?: string
  description?: string
  url: string
  icon: string
  metadata?: Record<string, any>
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = (searchParams.get('q') || '').trim()
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100)
    const types = (searchParams.get('types') || '').split(',').filter(t => t.trim())

    if (!query) {
      return NextResponse.json({ success: true, results: [], total: 0 })
    }

    const results: SearchResult[] = []
    const searchPromises: Promise<void>[] = []

    // Pages/Navigation Search
    if (types.length === 0 || types.includes('pages')) {
      const lowerQuery = query.toLowerCase()
      const pageResults = searchData
        .filter(item => {
          const nameMatch = item.name.toLowerCase().includes(lowerQuery)
          const sectionMatch = item.section.toLowerCase().includes(lowerQuery)
          return nameMatch || sectionMatch
        })
        .slice(0, limit)
        .map(item => ({
          type: 'page',
          id: item.id,
          title: item.name,
          subtitle: item.section,
          description: '',
          url: item.url,
          icon: item.icon || 'tabler-file',
          metadata: {
            section: item.section,
            excludeLang: item.excludeLang
          }
        }))
      
      results.push(...pageResults)
    }

    // Products Search
    if (types.length === 0 || types.includes('products')) {
      searchPromises.push(
        prisma.product
          .findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { sku: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { shortDescription: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: limit,
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              stockStatus: true,
              actualStock: true,
              image: true
            }
          })
          .then(products => {
            products.forEach(product => {
              results.push({
                type: 'product',
                id: product.id,
                title: product.name,
                subtitle: product.sku ? `SKU: ${product.sku}` : undefined,
                description: `Stock: ${product.actualStock} | Status: ${product.stockStatus}`,
                url: `/apps/ecommerce/products/edit/${product.id}`,
                icon: 'tabler-shopping-cart',
                metadata: {
                  price: product.price,
                  image: product.image
                }
              })
            })
          })
      )
    }

    // Customers Search
    if (types.length === 0 || types.includes('customers')) {
      searchPromises.push(
        prisma.customer
          .findMany({
            where: {
              OR: [
                { email: { contains: query, mode: 'insensitive' } },
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { username: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: limit,
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              wooId: true
            }
          })
          .then(customers => {
            customers.forEach(customer => {
              const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Unknown'
              results.push({
                type: 'customer',
                id: customer.id,
                title: name,
                subtitle: customer.email,
                url: `/apps/contacts?search=${encodeURIComponent(customer.email)}`,
                icon: 'tabler-user'
              })
            })
          })
      )
    }

    // Orders Search
    if (types.length === 0 || types.includes('orders')) {
      searchPromises.push(
        prisma.order
          .findMany({
            where: {
              OR: [
                { orderNumber: { contains: query, mode: 'insensitive' } },
                { customerNote: { contains: query, mode: 'insensitive' } },
                { paymentMethodTitle: { contains: query, mode: 'insensitive' } },
                { customer: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: limit,
            orderBy: { dateCreated: 'desc' },
            select: {
              id: true,
              orderNumber: true,
              status: true,
              total: true,
              dateCreated: true,
              customer: true
            }
          })
          .then(orders => {
            orders.forEach(order => {
              let customerName = 'Guest'
              try {
                const customerData = order.customer ? JSON.parse(order.customer) : null
                if (customerData) {
                  customerName = [customerData.firstName, customerData.lastName].filter(Boolean).join(' ') || 
                                customerData.email || 'Guest'
                }
              } catch {}
              
              results.push({
                type: 'order',
                id: order.id,
                title: `Order #${order.orderNumber}`,
                subtitle: `${customerName} - ${order.status}`,
                description: `Total: $${order.total || '0.00'}`,
                url: `/apps/orders/${order.id}`,
                icon: 'tabler-shopping-bag'
              })
            })
          })
      )
    }

    // Invoices Search
    if (types.length === 0 || types.includes('invoices')) {
      searchPromises.push(
        prisma.invoice
          .findMany({
            where: {
              OR: [
                { invoiceNumber: { contains: query, mode: 'insensitive' } },
                { customerName: { contains: query, mode: 'insensitive' } },
                { customerEmail: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: limit,
            orderBy: { date: 'desc' },
            select: {
              id: true,
              invoiceNumber: true,
              customerName: true,
              amount: true,
              invoiceStatus: true,
              date: true
            }
          })
          .then(invoices => {
            invoices.forEach(invoice => {
              results.push({
                type: 'invoice',
                id: invoice.id,
                title: `Invoice #${invoice.invoiceNumber}`,
                subtitle: invoice.customerName || 'Unknown Customer',
                description: `Amount: $${invoice.amount || '0.00'} - ${invoice.invoiceStatus}`,
                url: `/apps/invoices/${invoice.id}`,
                icon: 'tabler-file-invoice'
              })
            })
          })
      )
    }

    // Projects Search
    if (types.length === 0 || types.includes('projects')) {
      searchPromises.push(
        prisma.project
          .findMany({
            where: {
              name: { contains: query, mode: 'insensitive' }
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              status: true,
              createdAt: true
            }
          })
          .then(projects => {
            projects.forEach(project => {
              results.push({
                type: 'project',
                id: project.id,
                title: project.name,
                subtitle: `Status: ${project.status}`,
                url: `/apps/projects/${project.id}`,
                icon: 'tabler-briefcase'
              })
            })
          })
      )
    }

    // BOQs Search
    if (types.length === 0 || types.includes('boqs')) {
      searchPromises.push(
        prisma.bOQ
          .findMany({
            where: {
              OR: [
                { boqNumber: { contains: query, mode: 'insensitive' } },
                { projectName: { contains: query, mode: 'insensitive' } },
                { clientName: { contains: query, mode: 'insensitive' } },
                { clientEmail: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              boqNumber: true,
              projectName: true,
              clientName: true,
              total: true,
              status: true
            }
          })
          .then(boqs => {
            boqs.forEach(boq => {
              results.push({
                type: 'boq',
                id: boq.id.toString(),
                title: `BOQ #${boq.boqNumber}`,
                subtitle: `${boq.projectName} - ${boq.clientName}`,
                description: `Total: $${boq.total} - ${boq.status}`,
                url: `/apps/boq/${boq.id}`,
                icon: 'tabler-file-text'
              })
            })
          })
      )
    }

    // Event Tent Quotes Search
    if (types.length === 0 || types.includes('quotes')) {
      searchPromises.push(
        prisma.eventTentQuote
          .findMany({
            where: {
              OR: [
                { quoteNumber: { contains: query, mode: 'insensitive' } },
                { contactName: { contains: query, mode: 'insensitive' } },
                { contactEmail: { contains: query, mode: 'insensitive' } },
                { eventVenue: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              quoteNumber: true,
              contactName: true,
              eventType: true,
              total: true,
              status: true
            }
          })
          .then(quotes => {
            quotes.forEach(quote => {
              results.push({
                type: 'quote',
                id: quote.id,
                title: `Quote #${quote.quoteNumber}`,
                subtitle: `${quote.contactName || 'Unknown'} - ${quote.eventType}`,
                description: `Total: $${quote.total} - ${quote.status}`,
                url: `/apps/quotes/${quote.id}`,
                icon: 'tabler-file-dollar'
              })
            })
          })
      )
    }

    // Warehouses Search
    if (types.length === 0 || types.includes('warehouses')) {
      searchPromises.push(
        prisma.warehouse
          .findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { code: { contains: query, mode: 'insensitive' } },
                { city: { contains: query, mode: 'insensitive' } },
                { managerName: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: limit,
            select: {
              id: true,
              name: true,
              code: true,
              city: true,
              status: true
            }
          })
          .then(warehouses => {
            warehouses.forEach(warehouse => {
              results.push({
                type: 'warehouse',
                id: warehouse.id,
                title: warehouse.name,
                subtitle: `Code: ${warehouse.code}`,
                description: `${warehouse.city || 'Unknown Location'} - ${warehouse.status}`,
                url: `/apps/warehouses/${warehouse.id}`,
                icon: 'tabler-building-warehouse'
              })
            })
          })
      )
    }

    // Drivers Search
    if (types.length === 0 || types.includes('drivers')) {
      searchPromises.push(
        prisma.driver
          .findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } },
                { licenseNumber: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: limit,
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true
            }
          })
          .then(drivers => {
            drivers.forEach(driver => {
              results.push({
                type: 'driver',
                id: driver.id,
                title: driver.name,
                subtitle: driver.email || driver.phone || 'No contact',
                description: `Status: ${driver.status}`,
                url: `/apps/logistics/drivers/${driver.id}`,
                icon: 'tabler-user-check'
              })
            })
          })
      )
    }

    // Vehicles Search
    if (types.length === 0 || types.includes('vehicles')) {
      searchPromises.push(
        prisma.vehicle
          .findMany({
            where: {
              OR: [
                { registrationNo: { contains: query, mode: 'insensitive' } },
                { make: { contains: query, mode: 'insensitive' } },
                { model: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: limit,
            select: {
              id: true,
              registrationNo: true,
              make: true,
              model: true,
              status: true,
              type: true
            }
          })
          .then(vehicles => {
            vehicles.forEach(vehicle => {
              results.push({
                type: 'vehicle',
                id: vehicle.id,
                title: vehicle.registrationNo,
                subtitle: `${vehicle.make} ${vehicle.model}`,
                description: `${vehicle.type} - ${vehicle.status}`,
                url: `/apps/logistics/vehicles/${vehicle.id}`,
                icon: 'tabler-truck'
              })
            })
          })
      )
    }

    // POS Sales Search
    if (types.length === 0 || types.includes('sales')) {
      searchPromises.push(
        prisma.pOSSale
          .findMany({
            where: {
              OR: [
                { saleNumber: { contains: query, mode: 'insensitive' } },
                { notes: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: limit,
            orderBy: { saleDate: 'desc' },
            select: {
              id: true,
              saleNumber: true,
              totalAmount: true,
              paymentMethod: true,
              status: true,
              saleDate: true
            }
          })
          .then(sales => {
            sales.forEach(sale => {
              results.push({
                type: 'pos-sale',
                id: sale.id,
                title: `Sale #${sale.saleNumber}`,
                subtitle: `${sale.paymentMethod} - ${sale.status}`,
                description: `Total: $${sale.totalAmount}`,
                url: `/apps/pos/sales/${sale.id}`,
                icon: 'tabler-cash'
              })
            })
          })
      )
    }

    // Users Search
    if (types.length === 0 || types.includes('users')) {
      searchPromises.push(
        prisma.user
          .findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: limit,
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              active: true
            }
          })
          .then(users => {
            users.forEach(user => {
              results.push({
                type: 'user',
                id: user.id,
                title: user.name || 'Unknown User',
                subtitle: user.email || '',
                description: `Role: ${user.role} - ${user.active ? 'Active' : 'Inactive'}`,
                url: `/apps/users/${user.id}`,
                icon: 'tabler-user'
              })
            })
          })
      )
    }

    // Expenses Search
    if (types.length === 0 || types.includes('expenses')) {
      searchPromises.push(
        prisma.expense
          .findMany({
            where: {
              OR: [
                { category: { contains: query, mode: 'insensitive' } },
                { note: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: limit,
            orderBy: { date: 'desc' },
            select: {
              id: true,
              amount: true,
              category: true,
              date: true,
              note: true
            }
          })
          .then(expenses => {
            expenses.forEach(expense => {
              results.push({
                type: 'expense',
                id: expense.id,
                title: expense.category,
                subtitle: expense.note || 'No description',
                description: `Amount: $${expense.amount}`,
                url: `/apps/expenses/${expense.id}`,
                icon: 'tabler-receipt'
              })
            })
          })
      )
    }

    // Packing Slips Search
    if (types.length === 0 || types.includes('packing-slips')) {
      searchPromises.push(
        prisma.packingSlip
          .findMany({
            where: {
              OR: [
                { packingSlipNumber: { contains: query, mode: 'insensitive' } },
                { boothNumber: { contains: query, mode: 'insensitive' } },
                { notes: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              packingSlipNumber: true,
              status: true,
              boothNumber: true
            }
          })
          .then(packingSlips => {
            packingSlips.forEach(slip => {
              results.push({
                type: 'packing-slip',
                id: slip.id,
                title: `Packing Slip #${slip.packingSlipNumber}`,
                subtitle: slip.boothNumber ? `Booth: ${slip.boothNumber}` : 'No booth',
                description: `Status: ${slip.status}`,
                url: `/apps/packing-slips/${slip.id}`,
                icon: 'tabler-package'
              })
            })
          })
      )
    }

    // Execute all search promises in parallel
    await Promise.all(searchPromises)

    // Sort results by relevance (exact matches first)
    const lowerQuery = query.toLowerCase()
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(lowerQuery) ? 1 : 0
      const bExact = b.title.toLowerCase().includes(lowerQuery) ? 1 : 0
      return bExact - aExact
    })

    // Limit total results
    const limitedResults = results.slice(0, limit)

    return NextResponse.json({
      success: true,
      results: limitedResults,
      total: results.length,
      query
    })
  } catch (error: any) {
    console.error('Global search error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Search failed' },
      { status: 500 }
    )
  }
}
