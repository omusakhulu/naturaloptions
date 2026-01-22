const dns = require('dns')
const { URL } = require('url')

const testUrl = 'https://omnishop.omnispace3d.com'
const hostname = new URL(testUrl).hostname

console.log(`Resolving DNS for: ${hostname}`)

// Try with system DNS first
dns.lookup(hostname, { all: true }, (err, addresses) => {
  if (err) {
    console.error('DNS lookup error:', err)

    return
  }

  console.log('DNS Lookup (system):', JSON.stringify(addresses, null, 2))

  // Try with Google's DNS
  const resolver = new dns.Resolver()

  resolver.setServers(['8.8.8.8', '8.8.4.4']) // Google DNS

  resolver.resolve4(hostname, (err, addresses) => {
    if (err) {
      console.error('Google DNS resolve4 error:', err)

      return
    }

    console.log('Google DNS (IPv4):', addresses)
  })

  resolver.resolve6(hostname, (err, addresses) => {
    if (err) {
      console.error('Google DNS resolve6 error:', err)

      return
    }

    console.log('Google DNS (IPv6):', addresses)
  })
})
