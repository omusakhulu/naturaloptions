import https from 'https'
import dns from 'dns'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const results = {
    systemInfo: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV
    },
    networkConfig: {} as Record<string, any>,
    curlTest: {} as Record<string, any>,
    nodeTest: {} as Record<string, any>,
    recommendation: ''
  }

  try {
    console.log('🔍 Comprehensive system diagnostics...')

    // Test 1: DNS resolution (what curl uses)
    try {
      console.log('📡 Testing DNS resolution...')

      const addresses = await new Promise<string[]>((resolve, reject) => {
        dns.resolve4('omnishop.omnispace3d.com', (err, addresses) => {
          if (err) reject(err)
          else resolve(addresses)
        })
      })

      results.networkConfig.dnsResolution = addresses
      console.log('✅ DNS resolution successful:', addresses)
    } catch (error: any) {
      results.networkConfig.dnsError = error.message
      console.log('❌ DNS resolution failed:', error.message)
    }

    // Test 2: Direct Node.js HTTPS (exactly like curl)
    try {
      console.log('🔗 Testing direct Node.js HTTPS...')

      const options = {
        hostname: 'omnishop.omnispace3d.com',
        port: 443,
        path: '/wp-json/wc/v3/products/496',
        method: 'GET',
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(
              'ck_d54ed054d0803d25e3de47b8bb5fed9c03cf0fad:cs_bdcf4ac0f48fa175e438eda440011ef057a8d44d'
            ).toString('base64'),
          'User-Agent': 'curl/7.68.0', // Same as curl
          Accept: 'application/json'
        },
        timeout: 30000,
        rejectUnauthorized: false // Same as curl -k
      }

      const response = await new Promise<any>((resolve, reject) => {
        const req = https.request(options, res => {
          let data = ''

          res.on('data', chunk => (data += chunk))
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data.substring(0, 200)
            })
          })
        })

        req.on('error', error => {
          console.log('❌ Direct HTTPS error:', error.message)
          reject(error)
        })

        req.on('timeout', () => {
          console.log('❌ Direct HTTPS timeout')
          req.destroy()
          reject(new Error('Direct HTTPS timeout'))
        })

        req.setTimeout(30000)
        req.end()
      })

      results.nodeTest.directHttps = response
      console.log('✅ Direct HTTPS successful:', response.status)
    } catch (error: any) {
      results.nodeTest.directHttpsError = error.message
      console.log('❌ Direct HTTPS failed:', error.message)
    }

    // Test 3: Compare with curl simulation
    try {
      console.log('🔄 Testing curl-like request...')

      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)

      const curlCommand = `curl -s -m 30 -H "Authorization: Basic Y2tfZDU0ZWQwNTRkMDgwM2QyNWUzZGU0N2I4YmI1ZmVkOWMwM2NmMGZhZDpjcy5iZGNmNGFjMGY0OGZhMTc1ZTQzOGVkYTQ0MDExZWYwNTdhOGQ0NGQ=" http://omnishop.omnispace3d.com/wp-json/wc/v3/products/496`

      const { stdout, stderr } = await execAsync(curlCommand, { timeout: 35000 })

      if (stderr) {
        results.curlTest.error = stderr
        console.log('❌ curl test stderr:', stderr)
      } else {
        results.curlTest.success = true
        results.curlTest.response = stdout.substring(0, 200)
        console.log('✅ curl test successful')
      }
    } catch (error: any) {
      results.curlTest.error = error.message
      console.log('❌ curl test failed:', error.message)
    }
  } catch (error: any) {
    console.error('Diagnostics failed:', error)
    results.networkConfig.diagnosticsError = error.message
  }

  // Determine recommendation
  if (results.nodeTest.directHttpsError && results.curlTest.success) {
    results.recommendation =
      'Node.js HTTPS client fails while curl succeeds - likely Node.js environment or SSL library issue'
  } else if (results.networkConfig.dnsError) {
    results.recommendation = 'DNS resolution issue - check network configuration'
  } else if (results.nodeTest.directHttpsError) {
    results.recommendation = 'Network connectivity issue - check firewall/proxy settings'
  } else {
    results.recommendation = 'Issue identified - check logs for detailed error information'
  }

  return NextResponse.json({
    success: true,
    results,
    timestamp: new Date().toISOString()
  })
}
