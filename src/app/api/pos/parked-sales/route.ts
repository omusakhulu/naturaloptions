import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/config/auth'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const parkedSales = await prisma.parkedSale.findMany({
      where: {
        employee: { email: session.user.email }
      },
      include: {
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, parkedSales })
  } catch (error) {
    console.error('Error fetching parked sales:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, subtotal, discountAmount, tax, total, customer, notes } = body

    const employee = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 })
    }

    // Get default terminal
    const terminal = await prisma.pOSTerminal.findFirst({
      where: { name: 'Main Register' }
    })

    if (!terminal) {
      return NextResponse.json({ success: false, error: 'Terminal not found' }, { status: 404 })
    }

    const parkedSale = await prisma.parkedSale.create({
      data: {
        saleNumber: `PARK-${Date.now()}`,
        terminalId: terminal.id,
        employeeId: employee.id,
        customerId: customer?.id || null,
        subtotal: new Decimal(subtotal?.toString() || '0'),
        discountAmount: new Decimal(discountAmount?.toString() || '0'),
        taxAmount: new Decimal(tax?.toString() || '0'),
        totalAmount: new Decimal(total?.toString() || '0'),
        cartItems: JSON.stringify(items),
        notes: notes || ''
      }
    })

    return NextResponse.json({ success: true, parkedSale })
  } catch (error) {
    console.error('Error parking sale:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })
    }

    await prisma.parkedSale.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting parked sale:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
