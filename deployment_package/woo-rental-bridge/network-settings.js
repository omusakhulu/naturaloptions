console.log('Node.js Network Settings:')
console.log('========================')
console.log('Node.js version:', process.version)
console.log('Platform:', process.platform)
console.log('Arch:', process.arch)
console.log('NODE_OPTIONS:', process.env.NODE_OPTIONS || '(not set)')
console.log('HTTP_PROXY:', process.env.HTTP_PROXY || '(not set)')
console.log('HTTPS_PROXY:', process.env.HTTPS_PROXY || '(not set)')
console.log('NO_PROXY:', process.env.NO_PROXY || '(not set)')

console.log('\nNetwork Interfaces:')
const os = require('os')

console.log(JSON.stringify(os.networkInterfaces(), null, 2))

console.log('\nDNS Settings:')
const dns = require('dns')

console.log('DNS Servers:', dns.getServers())
