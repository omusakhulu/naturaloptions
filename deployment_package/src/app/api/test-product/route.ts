import { NextRequest, NextResponse } from 'next/server'
import { WooCommerceService } from '../../../lib/woocommerce/woocommerce-service'

export async function GET(request: NextRequest) {
  try {
    const wooService = WooCommerceService.getInstance()

    console.log('🧪 Testing getProduct with curl fallback...')
    const product = await wooService.getProduct(496)

    return NextResponse.json({
      success: true,
      product,
      timestamp: new Date().toISOString(),
      message: '✅ Product fetched successfully using curl fallback'
    })

  } catch (error: any) {
    console.error('Product fetch failed:', error)

    return NextResponse.json({
      success: false,
      error: 'Product fetch failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
