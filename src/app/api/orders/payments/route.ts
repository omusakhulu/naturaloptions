import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const wooOrderId = searchParams.get('wooOrderId')
  const posSaleId = searchParams.get('posSaleId')

  if (!wooOrderId && !posSaleId) {
    return NextResponse.json({ success: false, error: 'wooOrderId or posSaleId required' }, { status: 400 })
  }

  try {
    // If we have a posSaleId directly, look up payments
    if (posSaleId) {
      const sale = await prisma.pOSSale.findUnique({
        where: { id: posSaleId },
        include: {
          payments: {
            orderBy: { paymentDate: 'asc' }
          }
        }
      })

      if (!sale) {
        return NextResponse.json({ success: true, payments: [], source: 'not_found' })
      }

      const payments = sale.payments.map(p => ({
        id: p.id,
        method: p.paymentMethod,
        amount: Number(p.amount),
        status: p.status,
        reference: p.reference,
        cardLast4: p.cardLast4,
        cardType: p.cardType,
        checkNumber: p.checkNumber,
        cashTendered: p.cashTendered ? Number(p.cashTendered) : null,
        changeGiven: p.changeGiven ? Number(p.changeGiven) : null,
        date: p.paymentDate
      }))

      return NextResponse.json({
        success: true,
        payments,
        source: 'pos',
        posSaleNumber: sale.saleNumber,
        posSaleId: sale.id
      })
    }

    // Look up by WooCommerce order ID — find linked POS sale via notes
    if (wooOrderId) {
      // Check if there's a POSSale that references this WooCommerce order
      const sale = await prisma.pOSSale.findFirst({
        where: {
          notes: { contains: `WooCommerce Order #${wooOrderId}` }
        },
        include: {
          payments: {
            orderBy: { paymentDate: 'asc' }
          }
        }
      })

      if (sale) {
        const payments = sale.payments.map(p => ({
          id: p.id,
          method: p.paymentMethod,
          amount: Number(p.amount),
          status: p.status,
          reference: p.reference,
          cardLast4: p.cardLast4,
          cardType: p.cardType,
          checkNumber: p.checkNumber,
          cashTendered: p.cashTendered ? Number(p.cashTendered) : null,
          changeGiven: p.changeGiven ? Number(p.changeGiven) : null,
          date: p.paymentDate
        }))

        return NextResponse.json({
          success: true,
          payments,
          source: 'pos',
          posSaleNumber: sale.saleNumber,
          posSaleId: sale.id
        })
      }

      // No linked POS sale — return the order's single payment method from DB
      const order = await prisma.order.findFirst({
        where: { wooId: parseInt(String(wooOrderId)) }
      })

      if (order && order.paymentMethod) {
        return NextResponse.json({
          success: true,
          payments: [
            {
              id: 'woo-' + order.id,
              method: order.paymentMethodTitle || order.paymentMethod,
              amount: Number(order.total || 0),
              status: 'COMPLETED',
              reference: null,
              date: order.datePaid || order.dateCreated
            }
          ],
          source: 'woocommerce'
        })
      }

      return NextResponse.json({ success: true, payments: [], source: 'not_found' })
    }

    return NextResponse.json({ success: true, payments: [] })
  } catch (error: any) {
    console.error('Error fetching order payments:', error)

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
