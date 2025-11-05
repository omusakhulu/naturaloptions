// Simple WooCommerce service using Node.js built-ins only
import { URL } from 'url'
import dns from 'dns'
import { request as httpsRequest, RequestOptions, Agent as HttpsAgent } from 'https'
import { request as httpRequest, Agent as HttpAgent } from 'http'

// --- INTERFACES (Defined Once) ---

export interface WooCommerceImage {
  id: number
  src: string
  name: string
  alt: string
}

export interface WooCommerceProduct {
  id: number
  name: string
  slug: string
  sku: string
  price: string
  regular_price: string
  sale_price: string
  on_sale?: boolean
  stock_status: string
  stock_quantity?: number
  manage_stock?: boolean
  description?: string
  short_description?: string
  images?: WooCommerceImage[]
  categories?: WooCommerceCategory[]
  status?: 'draft' | 'pending' | 'private' | 'publish'
  type?: string
  virtual?: boolean
  downloadable?: boolean
  weight?: string
  dimensions?: {
    length?: string
    width?: string
    height?: string
  }
  average_rating?: string
  rating_count?: number | string
}

export interface WooCommerceCategory {
  id: number
  name: string
  slug: string
  description: string
  count: number
  image?: {
    src: string
  }
  parent: number
  menu_order: number
}

export interface WooCommerceWebhook {
  id: number
  name: string
  status: 'active' | 'paused' | 'disabled'
  topic: string
  delivery_url: string
  secret: string
  date_created: string
  date_modified: string
}

export interface WooCommerceCustomer {
  id: number
  date_created?: string
  date_modified?: string
  email: string
  first_name?: string
  last_name?: string
  role?: string
  username?: string
  password?: string
  billing?: {
    first_name?: string
    last_name?: string
    company?: string
    address_1?: string
    address_2?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
    email?: string
    phone?: string
  }
  shipping?: {
    first_name?: string
    last_name?: string
    company?: string
    address_1?: string
    address_2?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
  }
  is_paying_customer?: boolean
  avatar_url?: string
  meta_data?: Array<{
    id: number
    key: string
    value: any
  }>
}

export interface WooCommerceVariation {
  id?: number
  date_created?: string
  date_modified?: string
  description?: string
  permalink?: string
  sku?: string
  price?: string
  regular_price?: string
  sale_price?: string
  date_on_sale_from?: string | null
  date_on_sale_to?: string | null
  on_sale?: boolean
  status?: 'publish' | 'draft' | 'pending' | 'private'
  purchasable?: boolean
  virtual?: boolean
  downloadable?: boolean
  manage_stock?: boolean
  stock_quantity?: number | null
  stock_status?: 'instock' | 'outofstock' | 'onbackorder'
  backorders?: 'no' | 'notify' | 'yes'
  backorders_allowed?: boolean
  backordered?: boolean
  weight?: string
  dimensions?: {
    length?: string
    width?: string
    height?: string
  }
  shipping_class?: string
  shipping_class_id?: number
  image?: WooCommerceImage | null
  attributes?: Array<{
    id: number
    name: string
    option: string
  }>
  menu_order?: number
  meta_data?: Array<{
    id: number
    key: string
    value: any
  }>
}

// --- SINGLE WOOCOMMERCE SERVICE CLASS ---

export class WooCommerceService {
  private static instance: WooCommerceService
  private baseURL: string = ''
  private consumerKey: string = ''
  private consumerSecret: string = ''
  private baseAuthHeader: string = ''
  private httpAgent: HttpAgent
  private httpsAgent: HttpsAgent
  private lookupIPv4: typeof dns.lookup

  private constructor() {
    // Keep-alive agents to reuse sockets and reduce handshake time
    this.httpAgent = new HttpAgent({ keepAlive: true, maxSockets: 20 })
    this.httpsAgent = new HttpsAgent({ keepAlive: true, maxSockets: 20 })

    // Force IPv4 DNS lookups to avoid slow/blocked IPv6 paths
    this.lookupIPv4 = ((hostname: string, options: any, callback: any) => {
      const baseOpts = options && typeof options === 'object' ? options : {}

      return dns.lookup(
        hostname,
        { ...baseOpts, family: 4, verbatim: false } as dns.LookupOptions,
        typeof options === 'function' ? options : callback
      )
    }) as typeof dns.lookup

    this.initializeConfig()
  }

  /**
   * Get a single order by ID
   */
  public async getOrder(orderId: number | string): Promise<any> {
    const path = `/wp-json/wc/v3/orders/${orderId}`

    return this.executeApiRequest(path, 'GET')
  }

  /**
   * Update an order
   */
  public async updateOrder(orderId: number | string, data: Record<string, any>): Promise<any> {
    const path = `/wp-json/wc/v3/orders/${orderId}`

    return this.executeApiRequest(path, 'PUT', data)
  }

  /**
   * Create an order note (appears in Woo timeline)
   */
  public async addOrderNote(
    orderId: number | string,
    note: string,
    customerNote: boolean = false,
    addedByUser: boolean = true
  ): Promise<any> {
    const path = `/wp-json/wc/v3/orders/${orderId}/notes`

    return this.executeApiRequest(path, 'POST', {
      note,
      customer_note: customerNote,
      added_by_user: addedByUser
    })
  }

  /**
   * List orders with pagination
   */
  public async listOrders(
    params: {
      status?: string
      per_page?: number
      page?: number
      orderby?: string
      order?: string
    } = {}
  ): Promise<any[]> {
    const queryParams = new URLSearchParams({
      status: params.status || 'any',
      per_page: String(params.per_page || 100),
      page: String(params.page || 1),
      orderby: params.orderby || 'date',
      order: params.order || 'desc'
    })

    const path = `/wp-json/wc/v3/orders?${queryParams.toString()}`

    return this.executeApiRequest(path, 'GET')
  }

  /**
   * List customers with pagination
   */
  public async listCustomers(
    params: {
      per_page?: number
      page?: number
      orderby?: string
      order?: string
    } = {}
  ): Promise<WooCommerceCustomer[]> {
    const queryParams = new URLSearchParams({
      per_page: String(params.per_page || 100),
      page: String(params.page || 1),
      orderby: params.orderby || 'id',
      order: params.order || 'desc'
    })

    const path = `/wp-json/wc/v3/customers?${queryParams.toString()}`

    return this.executeApiRequest(path, 'GET')
  }

  /**
   * Get a single customer by ID
   */
  public async getCustomer(customerId: number | string): Promise<WooCommerceCustomer> {
    const path = `/wp-json/wc/v3/customers/${customerId}`

    return this.executeApiRequest(path, 'GET')
  }

  /**
   * Update a WooCommerce customer by ID
   */
  public async updateCustomer(
    customerId: number | string,
    data: Partial<WooCommerceCustomer>
  ): Promise<WooCommerceCustomer> {
    const path = `/wp-json/wc/v3/customers/${customerId}`

    return this.executeApiRequest(path, 'PUT', data)
  }

  public static getInstance(): WooCommerceService {
    if (!WooCommerceService.instance) {
      WooCommerceService.instance = new WooCommerceService()
    }

    return WooCommerceService.instance
  }

  /**
   * Initialize service configuration from environment variables
   */
  private initializeConfig() {
    this.baseURL =
      process.env.WOO_STORE_URL ||
      process.env.WOOCOMMERCE_STORE_URL ||
      process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL ||
      process.env.WORDPRESS_BASE_URL ||
      ''
    this.consumerKey =
      process.env.WOOCOMMERCE_CONSUMER_KEY ||
      process.env.WOO_CONSUMER_KEY ||
      process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY ||
      ''
    this.consumerSecret =
      process.env.WOOCOMMERCE_CONSUMER_SECRET ||
      process.env.WOO_CONSUMER_SECRET ||
      process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET ||
      ''

    if (this.consumerKey && this.consumerSecret) {
      this.baseAuthHeader = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64')
    }

    console.log('WooCommerce Service initialized with:', {
      baseURL: this.baseURL,
      hasConsumerKey: !!this.consumerKey,
      hasConsumerSecret: !!this.consumerSecret
    })
  }

  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.baseURL || !this.consumerKey || !this.consumerSecret) {
      this.initializeConfig()

      if (!this.baseURL || !this.consumerKey || !this.consumerSecret) {
        throw new Error('WooCommerce credentials not configured')
      }
    }
  }

  /**
   * Execute HTTP request using the built-in 'https' module
   */
  /**
   * Execute HTTP request using the built-in 'https' or 'http' module
   */
  private executeApiRequest<T = unknown>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: unknown
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      await this.ensureInitialized()

      // --- THIS IS THE NEW, SAFER LOGIC ---
      // 1. Build the full URL string first
      const fullServiceUrl = this.baseURL.replace(/\/$/, '') + path

      // 2. Let the native URL parser handle everything
      const parsedUrl = new URL(fullServiceUrl)
      const postData = data ? JSON.stringify(data) : null

      const options: RequestOptions = {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port ? Number(parsedUrl.port) : parsedUrl.protocol === 'https:' ? 443 : 80,
        path: parsedUrl.pathname + parsedUrl.search,
        method: method,
        servername: parsedUrl.hostname, // SNI
        lookup: this.lookupIPv4,
        headers: {
          Authorization: `Basic ${this.baseAuthHeader}`,
          'User-Agent': 'Omnishop Admin Dashboard/1.0',
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Connection: 'keep-alive'
        }
      }

      // --- END OF NEW LOGIC ---

      if (postData) {
        ;(options.headers as Record<string, string | number>)['Content-Length'] = Buffer.byteLength(postData)
      }

      // --- THIS IS THE NEW LOGIC ---
      // Determine if we should use 'https' or 'http'
      const isSecure = parsedUrl.protocol === 'https:'
      const requestClient = isSecure ? httpsRequest : httpRequest

      // Attach keep-alive agent per protocol
      options.agent = isSecure ? this.httpsAgent : this.httpAgent

      console.log(`📡 Executing Node.js request: ${method} ${parsedUrl.protocol}//${options.hostname}${options.path}`)

      const req = requestClient(options, res => {
        let responseBody = ''

        res.setEncoding('utf8')
        res.on('data', chunk => {
          responseBody += chunk
        })
        res.on('end', () => {
          try {
            const jsonResponse = responseBody ? JSON.parse(responseBody) : {}
            const statusCode = res.statusCode || 500
            const errorMessage = (jsonResponse as { message?: string }).message || responseBody

            // --- NEW DETAILED LOGGING ---
            if (statusCode >= 200 && statusCode < 300) {
              console.log(`✅ [${method}] Authentication successful (HTTP ${statusCode})`)
              resolve(jsonResponse)
            } else if (statusCode === 401 || statusCode === 403) {
              console.error(`❌ [${method}] AUTHENTICATION FAILED (HTTP ${statusCode})`, errorMessage)
              reject(new Error(`Authentication failed: ${errorMessage}`))
            } else {
              console.error(`❌ [${method}] Server Error (HTTP ${statusCode})`, errorMessage)
              reject(new Error(`Server error ${statusCode}: ${errorMessage}`))
            }

            // --- END NEW LOGGING ---

            if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
              console.error(`❌ HTTP Error ${res.statusCode}:`, jsonResponse.message || responseBody)
              reject(new Error(`HTTP Error ${res.statusCode}: ${jsonResponse.message || responseBody}`))
            } else {
              resolve(jsonResponse)
            }
          } catch (e) {
            console.error(`❌ Failed to parse JSON response:`, (e as Error).message)
            reject(new Error(`Failed to parse JSON response: ${(e as Error).message}`))
          }
        })
      })

      // Explicit timeout: abort socket if no response within 20s
      req.setTimeout(20000, () => {
        const err = new Error('ETIMEDOUT') as NodeJS.ErrnoException

        err.code = 'ETIMEDOUT'
        req.destroy(err)
      })

      // --- This is the NEW, improved code ---
      req.on('error', (e: NodeJS.ErrnoException) => {
        // Log the *full* error object to see codes like 'ECONNRESET'
        console.error(`❌ Request failed with code: ${e.code}`, e)

        // Pass the error code to the rejection
        reject(new Error(`Request failed: ${e.code || e.message}`))
      })

      if (postData) {
        req.write(postData)
      }

      req.end()
    })
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: number | string): Promise<WooCommerceProduct> {
    console.log(`🚀 Fetching product ${productId}`)
    const response = await this.executeApiRequest<WooCommerceProduct>(`/wp-json/wc/v3/products/${productId}`, 'GET')

    console.log(`✅ Product ${productId} fetched successfully`)

    return response
  }

  /**
   * Create a product
   */
  async createProduct(data: Record<string, unknown>): Promise<WooCommerceProduct> {
    console.log(`🚀 Creating product`)
    const response = await this.executeApiRequest<WooCommerceProduct>('/wp-json/wc/v3/products', 'POST', data)

    console.log(`✅ Product created with ID: ${response.id}`)

    return response
  }

  /**
   * Update a product
   */
  async updateProduct(id: number, data: Record<string, unknown>): Promise<WooCommerceProduct> {
    console.log(`🚀 Updating product ${id}`)
    const response = await this.executeApiRequest<WooCommerceProduct>(`/wp-json/wc/v3/products/${id}`, 'PUT', data)

    console.log(`✅ Product ${id} updated`)

    return response
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: number, force: boolean = true): Promise<any> {
    console.log(`🚀 Deleting product ${id}`)
    const path = `/wp-json/wc/v3/products/${id}?force=${force ? 'true' : 'false'}`
    const response = await this.executeApiRequest<any>(path, 'DELETE')
    console.log(`✅ Product ${id} deleted`)
    return response
  }

  /**
   * List products
   */
  async listProducts(page: number = 1, perPage: number = 100): Promise<WooCommerceProduct[]> {
    console.log(`🚀 Fetching products page ${page} (${perPage} per page)`)
    const path = `/wp-json/wc/v3/products?page=${page}&per_page=${perPage}`
    const response = await this.executeApiRequest<WooCommerceProduct[]>(path, 'GET')

    return Array.isArray(response) ? response : [response as unknown as WooCommerceProduct]
  }

  /**
   * Get all product categories
   */
  public async getCategories(): Promise<WooCommerceCategory[]> {
    console.log('🚀 Fetching categories from WooCommerce...')
    const path = '/wp-json/wc/v3/products/categories?per_page=100&hide_empty=false&orderby=name&order=asc'
    const response = await this.executeApiRequest<WooCommerceCategory[]>(path, 'GET')

    console.log(`✅ Successfully fetched ${response.length} categories`)

    return Array.isArray(response) ? response : [response as unknown as WooCommerceCategory]
  }

  /**
   * Get all product tags
   */
  public async getTags(): Promise<Array<{ id: number; name: string }>> {
    console.log('🚀 Fetching tags from WooCommerce...')
    const path = '/wp-json/wc/v3/products/tags?per_page=100&hide_empty=false&orderby=name&order=asc'
    const response = await this.executeApiRequest<Array<{ id: number; name: string }>>(path, 'GET')

    return Array.isArray(response) ? response : [response as unknown as { id: number; name: string }]
  }

  /**
   * List variations for a variable product
   */
  public async listVariations(
    productId: number,
    page: number = 1,
    perPage: number = 50
  ): Promise<WooCommerceVariation[]> {
    const path = `/wp-json/wc/v3/products/${productId}/variations?page=${page}&per_page=${perPage}`
    const response = await this.executeApiRequest<WooCommerceVariation[]>(path, 'GET')

    return Array.isArray(response) ? response : [response as unknown as WooCommerceVariation]
  }

  /**
   * Create or update a variation
   */
  public async upsertVariation(
    productId: number,
    variation: Partial<WooCommerceVariation> & { id?: number }
  ): Promise<WooCommerceVariation> {
    if (variation.id) {
      return this.executeApiRequest(`/wp-json/wc/v3/products/${productId}/variations/${variation.id}`, 'PUT', variation)
    }

    return this.executeApiRequest(`/wp-json/wc/v3/products/${productId}/variations`, 'POST', variation)
  }

  /**
   * List all webhooks
   */
  async listWebhooks(): Promise<WooCommerceWebhook[]> {
    console.log('🚀 Listing webhooks...')
    const response = await this.executeApiRequest<WooCommerceWebhook[]>('/wp-json/wc/v3/webhooks', 'GET')

    return Array.isArray(response) ? response : [response as unknown as WooCommerceWebhook]
  }

  /**
   * Create a new webhook
   */
  async createWebhook(webhookData: {
    name: string
    topic: string
    delivery_url: string
    secret: string
    status: 'active' | 'paused' | 'disabled'
  }): Promise<WooCommerceWebhook> {
    console.log(`🚀 Creating webhook "${webhookData.name}"...`)

    return this.executeApiRequest('/wp-json/wc/v3/webhooks', 'POST', webhookData)
  }

  /**
   * Delete a webhook by ID
   */
  async deleteWebhook(webhookId: number): Promise<{ success: boolean; message?: string }> {
    console.log(`🚀 Deleting webhook ${webhookId}...`)
    const path = `/wp-json/wc/v3/webhooks/${webhookId}?force=true`

    return this.executeApiRequest(path, 'DELETE')
  }

  /**
   * Set up required webhooks
   */
  async setupWebhooks(webhookBaseUrl: string): Promise<{ success: boolean; webhooks: WooCommerceWebhook[] }> {
    // (Implementation is the same as your provided code, just uses the new 'listWebhooks' and 'createWebhook')
    const requiredWebhooks = [
      {
        name: 'Order Created',
        topic: 'order.created',
        delivery_url: `${webhookBaseUrl}/api/webhooks/order-created`,
        secret: process.env.WEBHOOK_SECRET || 'your-secret-key',
        status: 'active' as const
      },
      {
        name: 'Order Updated',
        topic: 'order.updated',
        delivery_url: `${webhookBaseUrl}/api/webhooks/order-updated`,
        secret: process.env.WEBHOOK_SECRET || 'your-secret-key',
        status: 'active' as const
      },
      {
        name: 'Product Updated',
        topic: 'product.updated',
        delivery_url: `${webhookBaseUrl}/api/products/webhooks`,
        secret: process.env.WEBHOOK_SECRET || 'your-secret-key',
        status: 'active' as const
      }
    ]

    try {
      const existingWebhooks = await this.listWebhooks()
      const createdWebhooks: WooCommerceWebhook[] = []

      for (const webhook of requiredWebhooks) {
        const existing = existingWebhooks.find(
          wh => wh.topic === webhook.topic && wh.delivery_url === webhook.delivery_url
        )

        if (existing) {
          console.log(`✅ Webhook "${webhook.name}" already exists.`)
          createdWebhooks.push(existing)
        } else {
          console.log(`🔧 Creating webhook "${webhook.name}"...`)
          const newWebhook = await this.createWebhook(webhook)

          createdWebhooks.push(newWebhook)
          console.log(`✅ Webhook "${webhook.name}" created.`)
        }
      }

      return { success: true, webhooks: createdWebhooks }
    } catch (error) {
      console.error('❌ Error setting up webhooks:', error)

      return { success: false, webhooks: [] }
    }
  }

  /**
   * Test API connectivity and permissions
   */
  async testPermissions(): Promise<{
    readAccess: boolean
    writeAccess: boolean
    details: Record<string, unknown>
  }> {
    const testProductId = 496 // A valid product ID for testing
    const originalProductName = 'SHELVING FOR SHELL SCHEMEss' // Original name to revert to
    const testProductName = 'Test Permission Check'

    const results = {
      readAccess: false,
      writeAccess: false,
      details: {} as Record<string, unknown>
    }

    // Test READ access
    try {
      console.log('🔍 Testing READ permissions...')
      await this.executeApiRequest(`/wp-json/wc/v3/products/${testProductId}`, 'GET')
      results.readAccess = true
      results.details.getStatus = 200
      console.log('✅ READ access confirmed')
    } catch (error: any) {
      results.details.getError = error.message
      console.log('❌ READ access failed:', error.message)
    }

    // Test WRITE access only if READ access was successful
    if (results.readAccess) {
      try {
        console.log('🔍 Testing WRITE permissions...')
        const testData = { name: testProductName }

        await this.executeApiRequest(`/wp-json/wc/v3/products/${testProductId}`, 'PUT', testData)

        results.writeAccess = true
        results.details.putStatus = 200
        console.log('✅ WRITE access confirmed')

        // Clean up: revert the change
        console.log('🧹 Cleaning up test product name...')
        await this.executeApiRequest(`/wp-json/wc/v3/products/${testProductId}`, 'PUT', {
          name: originalProductName
        })
        console.log('✅ Cleanup complete.')
      } catch (error) {
        results.details.putError = (error as Error).message
        console.log('❌ WRITE access failed:', (error as Error).message)

        if ((error as Error).message.includes('403') || (error as Error).message.includes('401')) {
          results.details.authIssue = true
          results.details.errorType = 'AUTH_ERROR'
        } else {
          results.details.authIssue = true
          results.details.errorType = 'OTHER_ERROR'
        }
      }
    } else {
      console.log('⚠️ Skipping WRITE test because READ test failed.')
    }

    return results
  }
}
