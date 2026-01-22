import dotenv from 'dotenv'

import { WooCommerceService } from '../src/lib/woocommerce/woocommerce-service'

// Load environment variables
dotenv.config()

async function findProduct(wooId: string) {
  try {
    console.log(`🔍 Searching for product with WooCommerce ID: ${wooId}`)

    const wooService = WooCommerceService.getInstance()

    // Get the product by WooCommerce ID
    const product = await wooService.getProduct(wooId)

    if (product) {
      console.log('✅ Found product:')
      console.log(`ID: ${product.id}`)
      console.log(`Name: ${product.name}`)
      console.log(`SKU: ${product.sku || 'N/A'}`)
      console.log(`Status: ${product.status}`)
      console.log(`Price: ${product.regular_price || 'N/A'}`)
      console.log(`Stock: ${product.stock_quantity || 0} (${product.stock_status || 'N/A'})`)

      if (product.categories && product.categories.length > 0) {
        console.log('Categories:')
        product.categories.forEach((cat: any) => {
          console.log(`- ${cat.name} (ID: ${cat.id})`)
        })
      }
    } else {
      console.log('❌ Product not found')
    }
  } catch (error) {
    console.error('Error searching for product:', error instanceof Error ? error.message : String(error))
  }
}

// Get the WooCommerce ID from command line arguments
const wooId = process.argv[2]

if (!wooId) {
  console.error('Please provide a WooCommerce product ID as an argument')
  console.log('Usage: npx ts-node find-product.ts <wooId>')
  process.exit(1)
}

// Run the search
findProduct(wooId)
