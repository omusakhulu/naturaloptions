import { NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function GET() {
  try {
    const wooService = WooCommerceService.getInstance()
    const categories = await wooService.getCategories()

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)

    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
