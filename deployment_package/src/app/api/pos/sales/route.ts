import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/config/auth'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'
import { PaymentMethod, PaymentStatus, SaleStatus } from '@prisma/client'

function asNumber(value: any): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '0'))
  return Number.isFinite(n) ? n : 0
}

// Map payment method strings to valid PaymentMethod enum values
function mapPaymentMethod(method: string): PaymentMethod {
  const methodMap: { [key: string]: PaymentMethod } = {
    'cash': PaymentMethod.CASH,
    'card': PaymentMethod.CREDIT_CARD,
    'credit_card': PaymentMethod.CREDIT_CARD,
    'debit_card': PaymentMethod.DEBIT_CARD,
    'check': PaymentMethod.CHECK,
    'gift_card': PaymentMethod.GIFT_CARD,
    'store_credit': PaymentMethod.STORE_CREDIT,
    'digital_wallet': PaymentMethod.DIGITAL_WALLET,
    'mpesa': PaymentMethod.DIGITAL_WALLET, // Map M-PESA to digital wallet
    'bank': PaymentMethod.DIGITAL_WALLET, // Map bank transfer to digital wallet
    'split': PaymentMethod.CASH, // Default to CASH for split payments
  }

  const normalized = method.toLowerCase()

  return methodMap[normalized] || PaymentMethod.CASH
}

export async function POST(request: Request) {
  console.log('🚀 POST /api/pos/sales started')
  try {
    const body = await request.json()
    console.log('📦 Request body received:', JSON.stringify(body).substring(0, 200) + '...')

    const {
      items,
      subtotal,
      discount,
      discountAmount,
      tax,
      total,
      customer,
      payments,
      paymentMethod
    } = body

    const totalAmountNum = asNumber(total)
    const paymentsArray = Array.isArray(payments) ? payments : []
    const paymentsTotal = paymentsArray.reduce((sum: number, p: any) => {
      const rawStatus = String(p?.status || '').toUpperCase()
      const isCompleted = !rawStatus || rawStatus === 'COMPLETED'
      return sum + (isCompleted ? asNumber(p?.amount) : 0)
    }, 0)
    const isPaid = paymentsArray.length > 0 ? paymentsTotal >= totalAmountNum : true

    console.log('💾 Creating POS sale:', { total, itemCount: items.length, customer: customer?.id })

    // Get current user (employee)
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      console.log('❌ No session found')

      return NextResponse.json(
        {
          success: false,
          error: 'User not authenticated'
        },
        { status: 401 }
      )
    }

    console.log('✅ Session found:', session.user.email)

    // Get or create default terminal
    let terminal = await prisma.pOSTerminal.findFirst({
      where: {
        name: 'Main Register'
      }
    })

    if (!terminal) {
      console.log('📍 Creating terminal...')

      // Get default location or create one
      let location = await prisma.location.findFirst()

      if (!location) {
        console.log('📍 Creating location...')
        location = await prisma.location.create({
          data: {
            name: 'Main Store',
            address: 'Main Location'
          }
        })
      }

      terminal = await prisma.pOSTerminal.create({
        data: {
          name: 'Main Register',
          locationId: location.id,
          isActive: true
        }
      })
      console.log('✅ Terminal created:', terminal.id)
    } else {
      console.log('✅ Terminal found:', terminal.id)
    }

    // Get employee (user)
    console.log('👤 Looking for user:', session.user.email)

    const employee = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!employee) {
      console.log('❌ Employee not found for email:', session.user.email)

      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found'
        },
        { status: 404 }
      )
    }
    
    console.log('✅ Employee found:', employee.id)

    let posCustomerId: string | null = null
    if (customer) {
      const customerEmail = typeof customer?.email === 'string' ? customer.email.trim() : null

      if (customer?.id) {
        const existingById = await prisma.pOSCustomer.findUnique({
          where: { id: customer.id }
        })
        if (existingById) posCustomerId = existingById.id
      }

      if (!posCustomerId && customerEmail) {
        const existingByEmail = await prisma.pOSCustomer.findFirst({
          where: {
            email: {
              equals: customerEmail,
              mode: 'insensitive'
            }
          }
        })
        if (existingByEmail) posCustomerId = existingByEmail.id
      }

      if (!posCustomerId && customer?.id && !customerEmail) {
        const user = await prisma.user.findUnique({
          where: { id: customer.id },
          select: { email: true }
        })
  
        if (user?.email) {
          const existingFromUserEmail = await prisma.pOSCustomer.findFirst({
            where: {
              email: {
                equals: user.email,
                mode: 'insensitive'
              }
            }
          })
  
          if (existingFromUserEmail) {
            posCustomerId = existingFromUserEmail.id
          } else {
            const createdFromUser = await prisma.pOSCustomer.create({
              data: {
                customerNumber: `POSC-${Date.now()}`,
                email: user.email
              }
            })
            posCustomerId = createdFromUser.id
          }
        }
      }

      if (!posCustomerId && (customerEmail || customer?.firstName || customer?.lastName || customer?.phone)) {
        const createdCustomer = await prisma.pOSCustomer.create({
          data: {
            customerNumber: `POSC-${Date.now()}`,
            firstName: customer?.firstName || null,
            lastName: customer?.lastName || null,
            email: customerEmail,
            phone: customer?.phone || null,
            address: customer?.address || null,
            city: customer?.city || null,
            country: customer?.country || null
          }
        })
        posCustomerId = createdCustomer.id
      }
    }

    // Prepare sale data
    const saleItems = []

    for (const item of items) {
      let productId = item.id

      // If id looks like an integer (WooCommerce ID), find the CUID
      if (typeof productId === 'number' || (typeof productId === 'string' && /^\d+$/.test(productId))) {
        const product = await prisma.product.findUnique({
          where: { wooId: parseInt(productId.toString()) }
        })

        if (product) {
          productId = product.id
        } else {
          console.error(`❌ Product not found for wooId: ${productId}`)

          return NextResponse.json(
            {
              success: false,
              error: `Product not found: ${item.name || productId}`
            },
            { status: 404 }
          )
        }
      }

      saleItems.push({
        productId: productId,
        quantity: parseInt(item.quantity?.toString() || '0'),
        unitPrice: parseFloat(item.price?.toString() || '0'),
        total: parseFloat((item.price * item.quantity)?.toString() || '0')
      })
    }

    const saleData = {
      saleNumber: `POS-${Date.now()}`,
      saleDate: new Date(),
      terminalId: terminal.id,
      employeeId: employee.id,
      subtotal: parseFloat(subtotal?.toString() || '0'),
      discountAmount: parseFloat(discountAmount?.toString() || '0'),
      taxAmount: parseFloat(tax?.toString() || '0'),
      totalAmount: parseFloat(total?.toString() || '0'),
      paymentMethod: mapPaymentMethod(payments && payments.length > 0 ? 'split' : paymentMethod),
      paymentStatus: isPaid ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
      status: isPaid ? SaleStatus.COMPLETED : SaleStatus.PENDING,
      customerId: posCustomerId,
      saleItems: {
        create: saleItems
      }
    }

    console.log('📝 Sale data:', JSON.stringify(saleData, null, 2))

    // Create the sale with items and payments
    const sale = await prisma.pOSSale.create({
      data: saleData,
      include: {
        saleItems: true,
        payments: true,
        customer: true,
        terminal: true,
        employee: true
      }
    })

    // Create payment records
    try {
      if (paymentsArray.length > 0) {
        const paymentCreates = paymentsArray.map((p: any) => {
          const method = mapPaymentMethod(String(p?.method || p?.paymentMethod || 'cash'))
          const amount = asNumber(p?.amount)
          const reference = p?.reference ? String(p.reference) : p?.checkoutRequestId ? String(p.checkoutRequestId) : null
          const rawStatus = String(p?.status || '').toUpperCase()
          const status = rawStatus === 'FAILED'
            ? PaymentStatus.FAILED
            : rawStatus === 'PENDING'
              ? PaymentStatus.PENDING
              : PaymentStatus.COMPLETED

          return {
            saleId: sale.id,
            amount,
            paymentMethod: method,
            status,
            reference
          }
        }).filter((p: any) => p.amount > 0)

        if (paymentCreates.length > 0) {
          await prisma.payment.createMany({ data: paymentCreates })
        }
      } else {
        // Single payment: store a payment record as completed
        await prisma.payment.create({
          data: {
            saleId: sale.id,
            amount: totalAmountNum,
            paymentMethod: mapPaymentMethod(String(paymentMethod || 'cash')),
            status: PaymentStatus.COMPLETED,
            reference: null
          }
        })
      }
    } catch (payErr) {
      console.error('❌ Failed to create payment records:', payErr)
    }

    // Update product stock
    for (const item of saleItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          actualStock: {
            decrement: item.quantity
          },
          stockQuantity: {
            decrement: item.quantity
          }
        }
      })
    }

    // Update customer total spent if customer exists
    if (posCustomerId) {
      await prisma.pOSCustomer.update({
        where: { id: posCustomerId },
        data: {
          totalSpent: {
            increment: parseFloat(total?.toString() || '0')
          }
        }
      })
    }

    console.log('✅ Sale created successfully:', sale.id)

    // Create WooCommerce order
    let wooOrder = null

    try {
      console.log('🛒 Attempting to create WooCommerce order...')
      const wooService = WooCommerceService.getInstance()

      // Map POS items to WooCommerce line items
      const lineItems = items.map((item: any) => {
        const wooId = item.wooId || (typeof item.id === 'number' || (typeof item.id === 'string' && /^\d+$/.test(item.id)) ? parseInt(item.id.toString()) : null);
        
        return {
          product_id: wooId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          total: (item.price * item.quantity).toString()
        }
      }).filter((li: any) => li.product_id !== null)

      // Prepare WooCommerce order data
      const wooOrderData = {
        status: isPaid ? 'completed' : 'pending',
        payment_method: paymentMethod,
        payment_method_title: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
        set_paid: isPaid,

        // Customer information
        billing: customer ? {
          first_name: customer.firstName || '',
          last_name: customer.lastName || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address_1: customer.address || '',
          city: customer.city || '',
          country: customer.country || 'KE'
        } : {
          first_name: 'Walk-in',
          last_name: 'Customer',
          email: 'pos@naturaloptions.co.ke',
          address_1: 'In-store Purchase',
          city: 'Nairobi',
          country: 'KE'
        },

        shipping: customer ? {
          first_name: customer.firstName || '',
          last_name: customer.lastName || '',
          address_1: customer.address || '',
          city: customer.city || '',
          country: customer.country || 'KE'
        } : {
          first_name: 'Walk-in',
          last_name: 'Customer',
          address_1: 'In-store Purchase',
          city: 'Nairobi',
          country: 'KE'
        },

        // Line items
        line_items: lineItems,

        // Totals
        total: total.toString(),
        subtotal: subtotal.toString(),
        total_tax: tax.toString(),
        discount_total: discountAmount.toString(),

        // Meta data to link with POS sale
        meta_data: [
          {
            key: 'pos_sale_id',
            value: sale.id
          },
          {
            key: 'pos_sale_number',
            value: sale.saleNumber
          },
          {
            key: 'pos_terminal_id',
            value: terminal.id
          },
          {
            key: 'pos_employee_id',
            value: employee.id
          },
          {
            key: 'pos_sale_source',
            value: 'POS Terminal'
          }
        ],

        // Notes
        customer_note: `POS Sale ${sale.saleNumber} - ${items.length} item(s)`,
        notes: `Created from POS Terminal - Sale ID: ${sale.id}, Employee: ${session.user.email}`
      }

      wooOrder = await wooService.createOrder(wooOrderData)
      console.log('✅ WooCommerce order created:', wooOrder.id)

      // Update POS sale with WooCommerce order ID
      await prisma.pOSSale.update({
        where: { id: sale.id },
        data: {
          notes: `WooCommerce Order #${wooOrder.id} created`
        }
      })

    } catch (wooError) {
      console.error('❌ Failed to create WooCommerce order:', wooError)

      // Don't fail the entire sale if WooCommerce fails, just log it
    }

    return NextResponse.json({
      success: true,
      sale: {
        id: sale.id,
        saleNumber: sale.saleNumber,
        total: sale.totalAmount,
        itemCount: items.length,
        wooOrderId: wooOrder?.id || null
      }
    })
  } catch (error) {
    console.error('❌ Error creating POS sale:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create sale',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch sales for reports
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    const whereClause: any = {
      paymentStatus: 'COMPLETED'
    }

    if (startDate && endDate) {
      whereClause.saleDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const sales = await prisma.pOSSale.findMany({
      where: whereClause,
      include: {
        saleItems: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        payments: true,
        terminal: {
          select: {
            id: true,
            name: true
          }
        },
        employee: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: {
        saleDate: 'desc'
      },
      take: limit
    })

    const totalSales = await prisma.pOSSale.aggregate({
      where: whereClause,
      _sum: {
        totalAmount: true
      },
      _count: true
    })

    return NextResponse.json({
      success: true,
      sales: sales,
      summary: {
        totalAmount: totalSales._sum.totalAmount ? parseFloat(totalSales._sum.totalAmount.toString()) : 0,
        totalCount: totalSales._count
      }
    })
  } catch (error) {
    console.error('❌ Error fetching POS sales:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sales'
      },
      { status: 500 }
    )
  }
}
