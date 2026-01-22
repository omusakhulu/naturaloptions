import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const customerId = Number(body?.customerId)
    const boothNumber: string = String(body?.boothNumber ?? '').trim()

    if (!customerId || !boothNumber) {
      return NextResponse.json({ ok: false, error: 'customerId and boothNumber are required' }, { status: 400 })
    }

    // Update customer billingAddress JSON
    const customer = await prisma.customer.findUnique({ where: { wooId: customerId } })

    if (!customer) {
      return NextResponse.json({ ok: false, error: 'Customer not found' }, { status: 404 })
    }

    const billing = (() => {
      try {
        return customer.billingAddress ? JSON.parse(customer.billingAddress as any) : {}
      } catch {
        return {}
      }
    })()

    billing.boothNumber = boothNumber

    await prisma.customer.update({
      where: { wooId: customerId },
      data: { billingAddress: JSON.stringify(billing) }
    })

    // Also update latest order's billingAddress for consistency in views
    const latestOrder = await prisma.order.findFirst({
      where: { customerId: customerId },
      orderBy: { dateCreated: 'desc' }
    })

    if (latestOrder) {
      const ob = (() => {
        try {
          return latestOrder.billingAddress ? JSON.parse(latestOrder.billingAddress as any) : {}
        } catch {
          return {}
        }
      })()

      ob.boothNumber = boothNumber
      await prisma.order.update({
        where: { wooId: latestOrder.wooId },
        data: { billingAddress: JSON.stringify(ob) }
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}
