import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch active POS customers
    const customers = await prisma.pOSCustomer.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        customerNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        loyaltyPoints: true,
        totalSpent: true,
        address: true,
        city: true
      },
      orderBy: {
        lastName: 'asc'
      },
      take: 100 // Limit to 100 customers for performance
    })

    // Format customer data
    const formattedCustomers = customers.map(customer => ({
      id: customer.id,
      name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown',
      phone: customer.phone || '',
      email: customer.email || '',
      points: customer.loyaltyPoints || 0,
      totalSpent: parseFloat(customer.totalSpent?.toString() || '0'),
      customerNumber: customer.customerNumber
    }))

    return NextResponse.json({
      success: true,
      customers: formattedCustomers
    })
  } catch (error) {
    console.error('Error fetching POS customers:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch customers',
        customers: []
      },
      { status: 500 }
    )
  }
}
