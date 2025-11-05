import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🧪 Testing basic curl execution...')

  const results = {
    curlBasic: false,
    curlWithAuth: false,
    details: {} as Record<string, any>
  }

  try {
    // Test 1: Basic curl without auth
    try {
      console.log('📡 Testing basic curl command...')

      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)

      const basicCurl = `curl -s http://omnishop.omnispace3d.com/wp-json/wc/v3/products/496`

      console.log(`Executing: ${basicCurl}`)

      const { stdout, stderr } = await execAsync(basicCurl, {
        timeout: 30000,
        windowsHide: true,
        maxBuffer: 1024 * 1024
      })

      if (stderr && stderr.trim()) {
        results.details.basicCurlStderr = stderr
        console.log('⚠️ Basic curl stderr:', stderr)
      }

      if (stdout && stdout.trim()) {
        try {
          const response = JSON.parse(stdout)
          results.curlBasic = true
          results.details.basicCurlResponse = response.name || response.id
          console.log('✅ Basic curl successful:', response.name || response.id)
        } catch (parseError) {
          results.details.basicCurlRaw = stdout.substring(0, 200)
          console.log('✅ Basic curl successful (non-JSON):', stdout.substring(0, 100))
        }
      } else {
        results.details.basicCurlEmpty = true
        console.log('⚠️ Basic curl returned empty response')
      }

    } catch (error: any) {
      results.details.basicCurlError = error.message
      console.log('❌ Basic curl failed:', error.message)
    }

  } catch (error: any) {
    console.error('Basic curl test failed:', error)
    results.details.testError = error.message
  }

  return NextResponse.json({
    success: true,
    results,
    timestamp: new Date().toISOString()
  })
}
