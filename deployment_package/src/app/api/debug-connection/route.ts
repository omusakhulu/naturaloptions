import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const results = {
    basicConnectivity: false,
    apiEnabled: false,
    credentialsValid: false,
    details: {} as Record<string, any>
  }

  try {
    console.log('🔍 Testing basic connectivity to WooCommerce...')

    // Test 1: Basic connectivity (no auth)
    try {
      console.log('🔍 Testing basic connectivity to WooCommerce...')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('http://omnishop.omnispace3d.com/wp-json/', {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      results.basicConnectivity = response.ok
      results.details.basicConnectivityStatus = response.status
      console.log('📡 Basic connectivity:', response.status)
    } catch (error: any) {
      results.details.basicConnectivityError = error.message
      console.log('❌ Basic connectivity failed:', error.message)
    }

    // Test 2: Check if WC API is enabled
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('http://omnishop.omnispace3d.com/wp-json/wc/v3/', {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      results.apiEnabled = response.ok
      results.details.apiStatus = response.status
      console.log('🔧 WC API status:', response.status)
    } catch (error: any) {
      results.details.apiError = error.message
      console.log('❌ WC API check failed:', error.message)
    }

    // Test 3: Test API credentials
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const auth = btoa('ck_d54ed054d0803d25e3de47b8bb5fed9c03cf0fad:cs_bdcf4ac0f48fa175e438eda440011ef057a8d44d')

      const response = await fetch('http://omnishop.omnispace3d.com/wp-json/wc/v3/products/496', {
        headers: {
          'Authorization': `Basic ${auth}`
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      results.credentialsValid = response.ok
      results.details.authStatus = response.status
      console.log('🔐 API credentials status:', response.status)
    } catch (error: any) {
      results.details.authError = error.message
      console.log('❌ API credentials failed:', error.message)
    }
  } catch (error: any) {
    console.error('Basic connectivity test failed:', error)
    results.details.testError = error.message
  }

  return NextResponse.json({
    success: true,
    results,
    timestamp: new Date().toISOString()
  })
}
