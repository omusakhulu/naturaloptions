const https = require('https')
const dns = require('dns').promises

async function testServerConnection() {
  const hostname = 'omnishop.omnispace3d.com'

  console.log('🔍 Testing server connection...')

  try {
    // 1. Test DNS resolution
    console.log('\n1️⃣ Testing DNS resolution...')
    const addresses = await dns.resolve4(hostname)

    console.log(`✅ DNS resolved to: ${addresses.join(', ')}`)

    // 2. Test basic TCP connection
    console.log('\n2️⃣ Testing TCP connection to port 443...')
    await new Promise((resolve, reject) => {
      const socket = require('net').createConnection(443, hostname, () => {
        console.log('✅ Successfully connected to port 443')
        socket.destroy()
        resolve()
      })

      socket.setTimeout(5000)
      socket.on('timeout', () => {
        socket.destroy()
        reject(new Error('Connection to port 443 timed out'))
      })

      socket.on('error', error => {
        socket.destroy()
        reject(error)
      })
    })

    // 3. Test HTTPS request
    console.log('\n3️⃣ Testing HTTPS request...')

    const response = await new Promise((resolve, reject) => {
      const req = https.get(
        `https://${hostname}`,
        {
          timeout: 10000,
          rejectUnauthorized: false
        },
        res => {
          let data = ''

          res.on('data', chunk => (data += chunk))
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data
            })
          })
        }
      )

      req.on('error', reject)
      req.on('timeout', () => {
        req.destroy()
        reject(new Error('HTTPS request timed out'))
      })
    })

    console.log(`✅ HTTPS request successful (Status: ${response.statusCode})`)
    console.log('   Server:', response.headers.server || 'Not specified')
    console.log('   Content-Type:', response.headers['content-type'] || 'Not specified')
  } catch (error) {
    console.error('\n❌ Connection test failed:')
    console.error('   Error:', error.message)

    if (error.code) {
      console.error('   Error code:', error.code)

      if (error.code === 'ECONNREFUSED') {
        console.error('\n💡 Connection was refused. This usually means:')
        console.error('1. The web server is not running')
        console.error('2. The server is not accepting connections on port 443')
        console.error('3. A firewall is blocking the connection')
      } else if (error.code === 'ENOTFOUND') {
        console.error('\n💡 DNS lookup failed. Check your internet connection.')
      } else if (error.code === 'ETIMEDOUT') {
        console.error('\n💡 Connection timed out. This could mean:')
        console.error('1. The server is not responding')
        console.error('2. A network device is blocking the connection')
        console.error('3. The server is behind a firewall that is not forwarding port 443')
      }
    }
  }
}

testServerConnection()
