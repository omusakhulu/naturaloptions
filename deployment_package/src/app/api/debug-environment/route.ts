import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const results = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    envVars: {
      hasStoreUrl: !!process.env.WOO_STORE_URL,
      hasConsumerKey: !!process.env.WOOCOMMERCE_CONSUMER_KEY,
      hasConsumerSecret: !!process.env.WOOCOMMERCE_CONSUMER_SECRET,
      storeUrl: process.env.WOO_STORE_URL?.substring(0, 30) + '...',
      userAgent: 'Natural Options Admin Dashboard/1.0'
    },
    network: {} as Record<string, any>,
    recommendation: ''
  }

  try {
    console.log('🔍 Checking Node.js environment...')

    // Test DNS resolution
    try {
      const dns = await import('dns')
      const addresses = await dns.promises.resolve4('omnishop.omnispace3d.com')

      results.network.dnsResolution = addresses
      console.log('✅ DNS resolution successful:', addresses)
    } catch (error: any) {
      results.network.dnsError = error.message
      console.log('❌ DNS resolution failed:', error.message)
    }

    // Test basic TCP connection
    try {
      const net = await import('net')
      const client = new net.Socket()

      await new Promise<void>((resolve, reject) => {
        client.connect(80, 'omnishop.omnispace3d.com', () => {
          console.log('✅ TCP connection successful')
          results.network.tcpConnection = true
          client.end()
          resolve()
        })

        client.on('error', error => {
          console.log('❌ TCP connection failed:', error.message)
          results.network.tcpError = error.message
          reject(error)
        })

        client.setTimeout(10000, () => {
          console.log('❌ TCP connection timeout')
          results.network.tcpTimeout = true
          client.destroy()
          reject(new Error('TCP timeout'))
        })
      })
    } catch (error: any) {
      results.network.tcpError = error.message
    }
  } catch (error: any) {
    console.error('Environment check failed:', error)
    results.network.envError = error.message
  }

  // Determine recommendation
  if (results.network.dnsError) {
    results.recommendation = 'DNS resolution issue - check network configuration'
  } else if (results.network.tcpError) {
    results.recommendation = 'Network connectivity issue - check firewall/proxy settings'
  } else if (results.network.tcpTimeout) {
    results.recommendation = 'Network timeout - check if domain is accessible from Node.js environment'
  } else {
    results.recommendation = 'Environment looks good - issue might be in application code'
  }

  return NextResponse.json({
    success: true,
    results,
    timestamp: new Date().toISOString()
  })
}
