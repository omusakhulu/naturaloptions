import { NextResponse } from 'next/server'

import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

const prisma = new PrismaClient()

// Map payment method strings to valid PaymentMethod enum values
function mapPaymentMethod(method: string): string {
  const methodMap: { [key: string]: string } = {
    'cash': 'CASH',
    'card': 'CREDIT_CARD',
    'credit_card': 'CREDIT_CARD',
    'debit_card': 'DEBIT_CARD',
    'check': 'CHECK',
    'gift_card': 'GIFT_CARD',
    'store_credit': 'STORE_CREDIT',
    'digital_wallet': 'DIGITAL_WALLET',
    'mpesa': 'DIGITAL_WALLET', // Map M-PESA to digital wallet
    'bank': 'DIGITAL_WALLET', // Map bank transfer to digital wallet
    'split': 'CASH', // Default to CASH for split payments
  }

  const normalized = method.toLowerCase()

  return methodMap[normalized] || 'CASH'
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

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

    // Prepare sale data
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
      paymentStatus: 'COMPLETED',
      status: 'COMPLETED',
      customerId: customer?.id || null,
      saleItems: {
        create: items.map((item: any) => ({
          productId: item.id,
          quantity: parseInt(item.quantity?.toString() || '0'),
          unitPrice: parseFloat(item.price?.toString() || '0'),
          total: parseFloat((item.price * item.quantity)?.toString() || '0')
        }))
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

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.id },
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
    if (customer?.id) {
      await prisma.pOSCustomer.update({
        where: { id: customer.id },
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
      console.log('🛒 Creating WooCommerce order...')

      const wooService = WooCommerceService.getInstance()

      // Map POS items to WooCommerce line items
      const lineItems = items.map((item: any) => ({
        product_id: item.wooId || item.id, // Use WooCommerce product ID if available
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        total: (item.price * item.quantity).toString()
      }))

      // Prepare WooCommerce order data
      const wooOrderData = {
        status: 'completed', // Since payment is paid in full
        payment_method: paymentMethod,
        payment_method_title: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
        set_paid: true, // Mark as paid since POS payment is complete

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
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
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
        total: true
      },
      _count: true
    })

    return NextResponse.json({
      success: true,
      sales: sales,
      summary: {
        totalAmount: totalSales._sum.total ? parseFloat(totalSales._sum.total.toString()) : 0,
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
  } finally {
    await prisma.$disconnect()
  }
}
