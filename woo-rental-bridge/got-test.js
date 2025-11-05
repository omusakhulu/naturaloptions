const got = require('got')

;(async () => {
  try {
    const response = await got('https://omnishop.omnispace3d.com/wp-json/', {
      timeout: 10000,
      retry: 0,
      https: {
        rejectUnauthorized: false
      },
      headers: {
        'User-Agent': 'Got-Test/1.0'
      }
    })

    console.log('✅ Success!')
    console.log('Status:', response.statusCode)
    console.log('Headers:', response.headers)
    console.log('Body:', response.body.substring(0, 500) + '...')
  } catch (error) {
    console.error('❌ Error:')
    console.error('- Message:', error.message)
    console.error('- Code:', error.code)
    console.error('- Stack:', error.stack)
  }
})()
