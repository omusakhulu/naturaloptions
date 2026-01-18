import http from 'http'
import https from 'https'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const results = {
    curlCompatible: false,
    axiosCompatible: false,
    details: {} as Record<string, any>
  }

  try {
    console.log('🔍 Testing different HTTP clients...')

    // Test 1: Raw Node.js HTTP (most basic)
    try {
      console.log('📡 Testing raw Node.js HTTP client...')

      const basicAuth = Buffer.from('ck_d54ed054d0803d25e3de47b8bb5fed9c03cf0fad:cs_bdcf4ac0f48fa175e438eda440011ef057a8d44d').toString('base64')

      const options = {
        hostname: 'omnishop.omnispace3d.com',
        port: 80,
        path: '/wp-json/wc/v3/products/496',
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'User-Agent': 'Natural Options Admin Dashboard/1.0',
          'Accept': 'application/json'
        },
        timeout: 30000
      }

      const response = await new Promise<any>((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = ''
          res.on('data', (chunk) => data += chunk)
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              data: data,
              headers: res.headers
            })
          })
        })

        req.on('error', reject)
        req.on('timeout', () => {
          req.destroy()
          reject(new Error('Request timeout'))
        })

        req.setTimeout(30000)
        req.end()
      })

      results.curlCompatible = response.status === 200
      results.details.basicHttpStatus = response.status
      console.log('✅ Raw HTTP client result:', response.status)

    } catch (error: any) {
      results.details.basicHttpError = error.message
      console.log('❌ Raw HTTP client failed:', error.message)
    }

  } catch (error: any) {
    console.error('HTTP client test failed:', error)
    results.details.testError = error.message
  }

  return NextResponse.json({
    success: true,
    results,
    timestamp: new Date().toISOString()
  })
}
