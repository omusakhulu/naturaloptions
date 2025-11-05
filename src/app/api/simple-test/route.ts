import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🧪 Starting simple connectivity test...')

  const results = {
    directFetch: false,
    axiosTest: false,
    details: {} as Record<string, any>
  }

  try {
    // Test 1: Simple fetch (most basic)
    try {
      console.log('📡 Testing direct fetch...')

      const response = await fetch('http://omnishop.omnispace3d.com/wp-json/wc/v3/products/496', {
        headers: {
          Authorization:
            'Basic ' + btoa('ck_d54ed054d0803d25e3de47b8bb5fed9c03cf0fad:cs_bdcf4ac0f48fa175e438eda440011ef057a8d44d'),
          'User-Agent': 'Simple Test/1.0'
        }
      })

      results.directFetch = response.ok
      results.details.fetchStatus = response.status
      console.log('✅ Direct fetch result:', response.status)
    } catch (error: any) {
      results.details.fetchError = error.message
      console.log('❌ Direct fetch failed:', error.message)
    }
  } catch (error: any) {
    console.error('Simple test failed:', error)
    results.details.testError = error.message
  }

  return NextResponse.json({
    success: true,
    results,
    timestamp: new Date().toISOString()
  })
}
