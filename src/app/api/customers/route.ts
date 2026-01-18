import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/config/auth'
import { prisma } from '@/lib/prisma'
import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const customer = await prisma.customer.findUnique({
        where: { id }
      })
      return NextResponse.json({ success: true, customer })
    }

    const customers = await prisma.customer.findMany({
      orderBy: { syncedAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ success: true, customers })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const wooService = WooCommerceService.getInstance()

    // 1. Create in WooCommerce
    // WooCommerce expects fields like first_name, last_name, email, etc.
    const wooCustomer = (await wooService.createCustomer(body)) as any

    // 2. Save to local DB
    const customer = await prisma.customer.create({
      data: {
        wooId: wooCustomer.id,
        email: wooCustomer.email,
        firstName: wooCustomer.first_name || '',
        lastName: wooCustomer.last_name || '',
        username: wooCustomer.username || '',
        billingAddress: JSON.stringify(wooCustomer.billing || {}),
        shippingAddress: JSON.stringify(wooCustomer.shipping || {}),
        syncedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, customer })
  } catch (error: any) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to create customer' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    const wooService = WooCommerceService.getInstance()

    if (!id) {
      return NextResponse.json({ success: false, error: 'Customer ID is required' }, { status: 400 })
    }

    const localCustomer = await prisma.customer.findUnique({ where: { id } })
    if (!localCustomer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
    }

    // 1. Update in WooCommerce
    if (localCustomer.wooId) {
      await wooService.updateCustomer(localCustomer.wooId, updateData)
    }

    // 2. Update local DB
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        email: updateData.email,
        firstName: updateData.first_name,
        lastName: updateData.last_name,
        billingAddress: updateData.billing ? JSON.stringify(updateData.billing) : undefined,
        shippingAddress: updateData.shipping ? JSON.stringify(updateData.shipping) : undefined,
        syncedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, customer: updatedCustomer })
  } catch (error: any) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to update customer' }, { status: 500 })
  }
}
