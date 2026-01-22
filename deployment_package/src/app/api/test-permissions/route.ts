import { NextRequest, NextResponse } from 'next/server'

import { WooCommerceService } from '@/lib/woocommerce/woocommerce-service'

export async function GET(request: NextRequest) {
  try {
    const wooService = WooCommerceService.getInstance()

    console.log('🧪 Testing WooCommerce API permissions...')
    const permissions = await wooService.testPermissions()

    return NextResponse.json({
      success: true,
      permissions,
      timestamp: new Date().toISOString(),
      message: permissions.writeAccess
        ? '✅ Both read and write access confirmed'
        : permissions.details.authIssue
          ? '🚨 Authentication issue detected - API key lacks write permissions'
          : '❌ Write access failed - check WooCommerce API key permissions'
    })
  } catch (error: any) {
    console.error('Permission test failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Permission test failed',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
