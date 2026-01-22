const http = require('http')
const https = require('https')

const testUrl = 'https://omnishop.omnispace3d.com/wp-json/'

console.log(`Testing connection to: ${testUrl}`)

// Try with http first (will be redirected to https)
const protocol = testUrl.startsWith('https') ? https : http

const req = protocol.get(
  testUrl,
  {
    timeout: 10000,

    // Force IPv4
    family: 4,

    // Disable SSL verification (for testing only)
    rejectUnauthorized: false,

    // Add headers
    headers: {
      'User-Agent': 'Node-Test/1.0',
      Accept: 'application/json'
    }
  },
  res => {
    console.log(`✅ Status: ${res.statusCode} ${res.statusMessage}`)
    console.log('Headers:', JSON.stringify(res.headers, null, 2))

    let data = ''

    res.on('data', chunk => (data += chunk))
    res.on('end', () => {
      try {
        console.log('Response:', JSON.stringify(JSON.parse(data), null, 2))
      } catch {
        console.log('Raw response:', data)
      }
    })
  }
)

req.on('error', error => {
  console.error('❌ Request error:')
  console.error('- Message:', error.message)
  console.error('- Code:', error.code)
  console.error('- Stack:', error.stack)
})

req.on('timeout', () => {
  console.error('❌ Request timed out')
  req.destroy()
})

req.on('socket', socket => {
  console.log('Socket created')
  socket.on('connect', () => {
    console.log('Socket connected')
  })
  socket.on('secureConnect', () => {
    console.log('Secure connection established')
    console.log('Protocol:', socket.getProtocol())
    console.log('Cipher:', socket.getCipher())
  })
  socket.on('error', error => {
    console.error('Socket error:', error)
  })
})
