import { NextRequest, NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

import { saveCustomers } from '@/lib/db/customers'

export async function POST(request: NextRequest) {
  try {
    const wooService = WooCommerceService.getInstance()

    // Fetch all customers from WooCommerce with pagination
    const customers: any[] = []
    let page = 1
    const perPage = 100
    
    while (true) {
      const batch = await wooService.listCustomers({
        per_page: perPage,
        page: page
      })
      
      if (!batch || batch.length === 0) break
      
      customers.push(...batch)
      page++
      
      if (batch.length < perPage) break
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No customers found in WooCommerce',
        customersCreated: 0
      })
    }

    // Save customers to database
    const result = await saveCustomers(customers)

    console.log(`✅ Fetched and saved ${customers.length} customers from WooCommerce`)

    return NextResponse.json({
      success: true,
      message: `Fetched ${customers.length} customers from WooCommerce and saved to database`,
      customersCreated: customers.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching customers:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch customers',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
