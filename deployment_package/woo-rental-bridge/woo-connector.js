// woo-connector.js
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default

class WooCommerceConnector {
  constructor(config) {
    this.api = new WooCommerceRestApi({
      url: config.storeUrl,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      version: 'wc/v3',
      queryStringAuth: true, // Force Basic Authentication as query string
      wpAPI: true,
      axiosConfig: {
        // Increase timeout to 30 seconds
        timeout: 30000,

        // Bypass SSL verification (only for development)
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      }
    })
  }

  async testConnection() {
    try {
      console.log('🔍 Testing WooCommerce connection...')

      // Test basic API connectivity
      const response = await this.api.get('system_status')

      console.log('✅ Successfully connected to WooCommerce')
      console.log('   WooCommerce Version:', response.data.version)
      console.log('   WordPress Version:', response.data.wordpress.version)
      console.log('   PHP Version:', response.data.environment.php_version)

      return true
    } catch (error) {
      console.error('❌ Failed to connect to WooCommerce:')

      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('   Status:', error.response.status)
        console.error('   Data:', error.response.data)
      } else if (error.request) {
        // The request was made but no response was received
        console.error('   No response received from server')
        console.error('   This could mean:')
        console.error('   1. The server is down')
        console.error('   2. The API is not enabled')
        console.error('   3. A firewall is blocking the connection')
      } else {
        // Something happened in setting up the request
        console.error('   Error:', error.message)
      }

      return false
    }
  }

  async getProducts(params = {}) {
    try {
      // Default parameters
      const defaultParams = {
        per_page: 10,
        page: 1,
        status: 'publish',
        ...params
      }

      console.log('📦 Fetching products...')
      const response = await this.api.get('products', defaultParams)

      console.log(`✅ Found ${response.data.length} products`)

      return response.data
    } catch (error) {
      console.error('❌ Failed to fetch products:')
      this._handleError(error)
      throw error
    }
  }

  _handleError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('   Status:', error.response.status)
      console.error('   Data:', error.response.data)

      if (error.response.status === 401) {
        console.error('   Authentication failed. Please check your API keys and permissions.')
      } else if (error.response.status === 404) {
        console.error('   The requested resource was not found. Check the endpoint URL.')
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('   No response received from server')
    } else {
      // Something happened in setting up the request
      console.error('   Error:', error.message)
    }
  }
}

// Example usage
async function main() {
  const config = {
    storeUrl: 'https://omnishop.omnispace3d.com',
    consumerKey: 'ck_d54ed054d0803d25e3de47b8bb5fed9c03cf0fad',
    consumerSecret: 'cs_bdcf4ac0f48fa175e438eda440011ef057a8d44d'
  }

  const woo = new WooCommerceConnector(config)

  // Test connection
  const isConnected = await woo.testConnection()

  if (isConnected) {
    // Fetch products if connection is successful
    try {
      const products = await woo.getProducts({
        per_page: 5,
        orderby: 'date',
        order: 'desc'
      })

      console.log('\n📋 Sample Products:')
      products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`)
        console.log(`   ID: ${product.id}`)
        console.log(`   Price: ${product.price}`)
        console.log(`   Status: ${product.status}`)
        console.log(`   Link: ${product.permalink}`)
      })
    } catch (error) {
      console.error('Failed to fetch products:', error.message)
    }
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error)
}

module.exports = WooCommerceConnector
