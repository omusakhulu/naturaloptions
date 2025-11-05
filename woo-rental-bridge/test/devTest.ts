/**
 * test/devTest.ts
 * Simulates the Admin Dashboard's usage of the WooRentalBridge module.
 */

import * as dotenv from 'dotenv'

import { WooRentalBridge, AuthenticationError, ResourceNotFoundError } from '../src/WooRentalBridge'

dotenv.config() // Load environment variables from .env

async function runInitialTests() {
  console.log('--- WooRentalBridge Initial Connection Test ---')

  const config = {
    storeUrl: process.env.WOO_STORE_URL!,
    consumerKey: process.env.WOO_CONSUMER_KEY!,
    consumerSecret: process.env.WOO_CONSUMER_SECRET!,
    timeout: 60000
  }

  try {
    const wooConnector = new WooRentalBridge(config)

    // 1. Check Connection
    const isConnected = await wooConnector.checkConnection()

    console.log(`\n✅ Connection Status: ${isConnected ? 'Authenticated and Connected' : 'Failed'}`)

    if (!isConnected) return

    // 2. Test Product Listing (Simulated Dashboard Inventory Screen Data Fetch)
    console.log('\n--- Products Service Test (Inventory List) ---')

    // Fetch products, simulating the Admin Dashboard filtering for published items
    const publishedProducts = await wooConnector.products.listProducts({
      status: 'publish',
      per_page: 5 // Optional: Can set a smaller per_page to test pagination logic
    })

    if (publishedProducts.length > 0) {
      console.log(`✅ Successfully retrieved ${publishedProducts.length} products (Pagination handled).`)
      console.log(`First Product: ${publishedProducts[0].name} (ID: ${publishedProducts[0].id})`)

      // 3. Test Single Product Fetch
      console.log('\n--- Single Product Test (Product Detail Screen) ---')
      const product = await wooConnector.products.getProducts(publishedProducts[0].id)

      console.log(`✅ Retrieved product details for ID ${product.id}.`)
    } else {
      console.log('⚠️ No published products found to test against.')
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error(`\n❌ CRITICAL AUTH ERROR: ${error.message}`)
      console.error(`Check your .env file and WooCommerce API Keys.`)
    } else if (error instanceof ResourceNotFoundError) {
      console.error(`\n❌ Resource Not Found: ${error.message}`)
    } else {
      console.error('\n❌ An unexpected error occurred:', error)
    }
  }
}

runInitialTests()
