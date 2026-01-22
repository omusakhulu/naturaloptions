// example.ts
import { WooRentalBridge, WooRentalBridgeConfig } from './src/index';
import dotenv from 'dotenv';

dotenv.config(); // Load .env file

async function main() {
  console.log('Starting WooRentalBridge example...');

  const config: WooRentalBridgeConfig = {
    storeUrl: process.env.WOO_STORE_URL!,
    consumerKey: process.env.WOO_CONSUMER_KEY!,
    consumerSecret: process.env.WOO_CONSUMER_SECRET!,
    timeout: Number(process.env.WOO_TIMEOUT) || 30000,
  };

  try {
    const wooConnector = new WooRentalBridge(config);
    console.log('WooRentalBridge instance created.');

    // --- Test listProducts ---
    console.log('\nFetching all products (paginated)...');
    const allProducts = await wooConnector.products.listProducts({ per_page: 5 }); // Fetch small batches for demo
    console.log(`Total products fetched: ${allProducts.length}`);
    // console.log('First few products:', allProducts.slice(0, 2)); // Log first few

    console.log('\nFetching products with filters (status: draft)...');
    const draftProducts = await wooConnector.products.listProducts({ status: 'draft' });
    console.log(`Draft products found: ${draftProducts.length}`);
    // console.log('Draft Products:', draftProducts);


    console.log('\nFetching products with search...');
     const searchResults = await wooConnector.products.listProducts({ search: 'Shirt' }); // Example search term
     console.log(`Search results for 'Shirt': ${searchResults.length}`);
     // console.log('Search Results:', searchResults);

  } catch (error: any) {
    console.error('\n--- ERROR ---');
    console.error(`Error Name: ${error.name}`);
    console.error(`Error Message: ${error.message}`);
    if (error.statusCode) {
        console.error(`Status Code: ${error.statusCode}`);
    }
     if (error.data) {
        console.error('Error Data:', JSON.stringify(error.data, null, 2));
    }
    // console.error('Full Error:', error); // Uncomment for more details if needed
  }
}

main();