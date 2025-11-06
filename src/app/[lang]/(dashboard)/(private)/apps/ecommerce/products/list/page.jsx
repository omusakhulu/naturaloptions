// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// Component Imports
import { mapWooCommerceProducts } from '@/utils/woocommerce'
import cache from '@/utils/cache'
import { saveProducts, getAllProducts } from '@/lib/db/products'
import FetchAllButton from '@/components/products/FetchAllButton'
import ProductListTable from '@views/apps/ecommerce/products/list/ProductListTable'
import ProductCard from '@views/apps/ecommerce/products/list/ProductCard'
import { getValidCategory } from '@/utils/categories'

import { wooClient } from '@/lib/woocommerce'

// Cache key for products
const PRODUCTS_CACHE_KEY = 'woocommerce_products'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches products from database and transforms them for display
 * @returns {Promise<Array>} Array of transformed products from database
 */
async function getProductsFromDatabase() {
  try {
    console.log('Fetching products from database...')
    const dbProducts = await getAllProducts()

    if (!Array.isArray(dbProducts) || dbProducts.length === 0) {
      console.log('No products found in database')

      return []
    }

    console.log(`Found ${dbProducts.length} products in database`)

    // Transform database products for display
    const transformedProducts = dbProducts.map(product => {
      // Parse categories from JSON string

      let parsedCategories = []

      try {
        parsedCategories =
          typeof product.categories === 'string' ? JSON.parse(product.categories) : product.categories || []
      } catch (e) {
        console.warn('Failed to parse categories for product', product.wooId, e)
        parsedCategories = []
      }

      // Ensure category is always a string
      const categoryName = getValidCategory(parsedCategories)

      return {
        id: product.wooId,
        productName: product.name,
        productBrand: product.name,
        image: product.image || 'https://via.placeholder.com/38',
        category: categoryName, // This is a string from getValidCategory()
        stock: product.stockStatus === 'instock',
        sku: product.sku || '',
        price: product.price ? `$${product.price}` : '$0.00',
        qty: product.stockQuantity || 0,
        status: product.status === 'publish' ? 'Published' : 'Inactive',
        rating: product.rating || 4.0,
        images: product.images || [{ src: product.image || 'https://via.placeholder.com/38' }],
        stock_status: product.stockStatus || 'instock',
        stock_quantity: product.stockQuantity || 0,
        categories: parsedCategories,
        _cachedAt: Date.now()
      }
    })

    console.log(`Transformed ${transformedProducts.length} products for display`)

    return transformedProducts
  } catch (error) {
    console.error('Failed to fetch products from database:', error instanceof Error ? error.message : 'Unknown error')

    return []
  }
}

/**
 * Fetches products from WooCommerce API or returns cached data
 * @returns {Promise<Array>} Array of products
 */
async function getWooCommerceProducts() {
  // Validate environment variables
  const requiredEnvVars = ['WOO_STORE_URL', 'WOO_CONSUMER_KEY', 'WOO_CONSUMER_SECRET']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '))
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }

  // Check cache first
  const cachedProducts = cache.get(PRODUCTS_CACHE_KEY)

  if (cachedProducts) {
    console.log('Returning cached products')

    return cachedProducts
  }

  try {
    console.log('Fetching fresh products from WooCommerce...')
    console.log('Environment Variables:', {
      storeUrl: process.env.WOO_STORE_URL,
      hasKey: !!process.env.WOO_CONSUMER_KEY,
      hasSecret: !!process.env.WOO_CONSUMER_SECRET
    })




    if (process.env.NODE_ENV !== 'production') {
      console.log('WooCommerce Config:', {
        storeUrl: process.env.WOO_STORE_URL ? `${process.env.WOO_STORE_URL.substring(0, 20)}...` : 'Not set',
        hasKey: !!process.env.WOO_CONSUMER_KEY,
        hasSecret: !!process.env.WOO_CONSUMER_SECRET
      })
    }


    console.log('Sending request to WooCommerce API...')
    console.log('Fetching products from:', process.env.WOO_STORE_URL)

    const productsRes = await wooClient.get('products', { status: 'publish', per_page: 20, orderby: 'modified', order: 'desc' })
    const products = productsRes.data || []

    if (!Array.isArray(products)) {
      console.error('Invalid products data received:', products)
      throw new Error('Invalid products data format received from API')
    }

    console.log(`Received ${products.length} products from WooCommerce`)

    // Fetch categories first to create mapping
    console.log('🔄 Fetching categories from WooCommerce...')
    let categories = []

    try {
      categories = (await wooClient.get('products/categories', { per_page: 100, orderby: 'count', order: 'desc' })).data || []
      console.log(`✅ Fetched ${categories.length} categories`)
    } catch (error) {
      console.warn('⚠️ Failed to fetch categories:', error)
    }

    // Create category mapping (ID -> Name)
    const categoryMap = new Map()

    categories.forEach(category => {
      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
        slug: category.slug
      })
    })

    // Map categories to products
    const productsWithCategories = products.map(product => {
      const mappedCategories =
        product.categories?.map(catId => {
          const category = categoryMap.get(catId)

          return category || { id: catId, name: `Category ${catId}` }
        }) || []

      return {
        ...product,
        categories: mappedCategories
      }
    })

    console.log(`✅ Mapped categories for ${productsWithCategories.length} products`)

    // Save products to database
    try {
      await saveProducts(productsWithCategories)
      console.log(`✅ Saved ${productsWithCategories.length} products to database`)
    } catch (dbError) {
      console.warn(
        '⚠️ Failed to save products to database:',
        dbError instanceof Error ? dbError.message : 'Unknown error'
      )
    }

    // Transform WooCommerce products using our utility function
    const transformedProducts = mapWooCommerceProducts(productsWithCategories).map(product => ({
      ...product,
      qty: product.stock_quantity || 0,

      // Keep status from Woo mapping; normalize to Published/Inactive
      status: product.status === 'Published' ? 'Published' : 'Inactive',
      price: product.price ? `$${product.price}` : '$0.00',
      rating: product.rating || 4.0,
      _cachedAt: Date.now()
    }))

    // Cache the transformed products
    cache.set(PRODUCTS_CACHE_KEY, transformedProducts, CACHE_TTL)
    console.log(`Cached ${transformedProducts.length} products for ${CACHE_TTL / 1000} seconds`)

    return transformedProducts
  } catch (error) {
    console.error('Failed to fetch WooCommerce products:', {
      name: error.name,
      message: error.message,
      status: error.response?.status,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    })

    // Return mock data for development if no cache is available
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock data due to API error and no cache available')

      return [
        {
          id: 1,
          productName: 'Sample Product',
          productBrand: 'Sample Brand',
          image: 'https://via.placeholder.com/38',
          category: 'Electronics',
          stock: true,
          sku: 'SAMPLE-001',
          price: '$29.99',
          qty: 10,
          status: 'Published',
          rating: 4.5,
          images: [{ src: 'https://via.placeholder.com/38' }],
          stock_status: 'instock',
          stock_quantity: 10,
          categories: [{ name: 'Electronics' }]
        },
        {
          id: 2,
          productName: 'Another Product',
          productBrand: 'Test Brand',
          image: 'https://via.placeholder.com/38',
          category: 'Shoes',
          stock: false,
          sku: 'SAMPLE-002',
          price: '$49.99',
          qty: 0,
          status: 'Inactive',
          rating: 4.0,
          images: [{ src: 'https://via.placeholder.com/38' }],
          stock_status: 'outofstock',
          stock_quantity: 0,
          categories: [{ name: 'Shoes' }]
        }
      ]
    }

    return []
  }
}

// ** MODIFY: Your main page component **
// Ensure it's an async function
const ProductListPage = async () => {
  // Try to fetch products from database first
  let productsData = await getProductsFromDatabase()

  // If no products in database, fetch from WooCommerce API
  if (!productsData || productsData.length === 0) {
    console.log('No products in database, fetching from WooCommerce API...')
    productsData = await getWooCommerceProducts()
  }

  // ** Keep original structure, but pass the new data **

  const totalProducts = Array.isArray(productsData) ? productsData.length : 0

  const publishedCount = Array.isArray(productsData)
    ? productsData.filter(p => String(p.status || '').toLowerCase() === 'published').length
    : 0

  const inStockCount = Array.isArray(productsData)
    ? productsData.filter(p => p.stock === true || String(p.stock_status).toLowerCase() === 'instock').length
    : 0

  const outOfStockCount = totalProducts > 0 ? totalProducts - inStockCount : 0

  const metrics = { totalProducts, publishedCount, inStockCount, outOfStockCount }

  return (
    <Grid size={12}>
      <Grid item xs={12} sx={{ mb: 5 }}>
        <ProductCard style='margin-bottom:30 px !Important;' metrics={metrics} />
      </Grid>
      <Grid item xs={12} sx={{ mb: 5 }}>
        <FetchAllButton />
      </Grid>
      <Grid item xs={12}>
        {Array.isArray(productsData) && productsData.length > 0 ? (
          <ProductListTable productData={productsData} />
        ) : (
          <div className='flex items-center justify-center p-8'>
            <Typography variant='h6'>No products found or failed to load products.</Typography>
          </div>
        )}
      </Grid>
    </Grid>
  )
}

// ** UPDATE: Ensure this is the default export **

export default ProductListPage

// ** REMOVE or COMMENT OUT: Any conflicting duplicate component definitions **
// const eCommerceProductsList = async () => { ... }
// export default eCommerceProductsList
