import axios from 'axios'

// Server-side only Node.js modules
let http, https, dns

if (typeof window === 'undefined') {
  http = require('http')
  https = require('https')
  dns = require('dns')

  // Set default DNS lookup to prefer IPv4
  dns.setDefaultResultOrder('ipv4first')
}

// Constants
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3

// Create a client that works in both environments
const createWooCommerceClient = () => {
  const baseURL = process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL || process.env.WOO_STORE_URL
  const consumerKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY
  const consumerSecret = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET

  if (!baseURL || !consumerKey || !consumerSecret) {
    // Only log warning in development mode and on server side
    if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
      console.warn('[WooCommerce] Environment variables not configured - using dummy client');
    }
    // Return a dummy client that won't crash the app
    return {
      get: async () => {
        console.warn('WooCommerce API not configured');
        return [];
      },
      post: async () => {
        console.warn('WooCommerce API not configured');
        return {};
      },
      put: async () => {
        console.warn('WooCommerce API not configured');
        return {};
      },
      delete: async () => {
        console.warn('WooCommerce API not configured');
        return {};
      },
      registerWebhooks: async () => {
        console.warn('WooCommerce API not configured');
        return {
          success: false,
          message: 'WooCommerce API not configured',
          details: []
        };
      },
      testConnection: async () => {
        console.warn('WooCommerce API not configured');
        return {
          success: false,
          error: 'WooCommerce API not configured'
        };
      }
    };
  }

  // Ensure baseURL ends with a single slash
  const apiBaseURL = `${baseURL.replace(/\/+$/, '')}/wp-json/wc/v3/`

  console.log('[WooCommerce] Initializing client with base URL:', apiBaseURL)

  // Create axios instance with basic auth and timeouts
  const client = axios.create({
    baseURL: apiBaseURL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Omnishop Admin/1.0',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache'
    },
    auth: {
      username: consumerKey,
      password: consumerSecret
    },
    timeout: DEFAULT_TIMEOUT,
    timeoutErrorMessage: 'Request to WooCommerce API timed out',
    maxContentLength: 50 * 1024 * 1024, // 50MB
    maxBodyLength: 50 * 1024 * 1024, // 50MB
    validateStatus: status => status >= 200 && status < 500
  })

  // Disable request buffering for better timeout handling
  client.defaults.httpAgent = new (require('http').Agent)({
    keepAlive: true,
    timeout: 30000,
    maxSockets: 10
  })

  client.defaults.httpsAgent = new (require('https').Agent)({
    rejectUnauthorized: false, // Only for development
    keepAlive: true,
    timeout: 30000,
    maxSockets: 10
  })

  // Add request interceptor for logging and request modification
  client.interceptors.request.use(async config => {
    // Log request details
    console.log('[WooCommerce] Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
      params: config.params,
      data: config.data ? JSON.parse(JSON.stringify(config.data)) : null,
      timeout: config.timeout,
      auth: !!config.auth
    })

    // Don't modify the URL - use the domain name directly
    // This avoids SSL/TLS issues with direct IP access
    if (config.url && config.url.startsWith('http')) {
      const url = new URL(config.url)

      config.url = url.pathname + url.search
    }

    // Ensure the URL starts with a slash
    if (config.url && !config.url.startsWith('/')) {
      config.url = '/' + config.url
    }

    // Remove any double slashes in the URL
    config.url = config.url.replace(/([^:]\/)\/+/g, '$1')

    // Log the request
    console.log(`[WooCommerce] Preparing ${config.method?.toUpperCase()} request to ${config.url}`)

    return config
  })

  // Add response interceptor for logging
  client.interceptors.response.use(
    response => {
      console.log('[WooCommerce] Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data ? 'Received response data' : 'No data in response',
        config: {
          url: response.config?.url,
          method: response.config?.method
        }
      })

      return response
    },
    error => {
      console.error('[WooCommerce] Error Response:', {
        message: error.message,
        code: error.code,
        response: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data || 'No response data',
          headers: error.response?.headers
        },
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data ? JSON.parse(JSON.stringify(error.config.data)) : null
        },
        stack: error.stack
      })

      return Promise.reject(error)
    }
  )

  // Helper method for retrying failed requests
  const withRetry = async (fn, retries = MAX_RETRIES, attempt = 1) => {
    try {
      console.log(`[WooCommerce] API request attempt ${attempt}/${MAX_RETRIES}`)

      return await fn()
    } catch (error) {
      if (retries <= 0) {
        console.error('[WooCommerce] Max retries reached. Request failed with error:', {
          message: error.message,
          code: error.code,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            timeout: error.config?.timeout,
            headers: Object.keys(error.config?.headers || {})
          },
          response: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          },
          stack: error.stack
        })
        throw error
      }

      const retryIn = 1000 * (MAX_RETRIES - retries + 1) // Exponential backoff

      console.warn(`[WooCommerce] Request failed, retrying in ${retryIn}ms... (${retries} attempts left)`, {
        error: error.message,
        code: error.code,
        status: error.response?.status
      })

      await new Promise(resolve => setTimeout(resolve, retryIn))

      return withRetry(fn, retries - 1, attempt + 1)
    }
  }

  // Helper methods with error handling and retries
  const get = async (endpoint, params = {}, config = {}) => {
    console.log(`[WooCommerce] GET ${endpoint}`, { params })

    try {
      const response = await withRetry(() => client.get(endpoint, { ...config, params }))

      console.log(`[WooCommerce] GET ${endpoint} successful`)

      return response
    } catch (error) {
      console.error(`[WooCommerce] GET ${endpoint} failed:`, error.message)
      throw error
    }
  }

  const post = async (endpoint, data, config = {}) => {
    console.log(`[WooCommerce] POST ${endpoint}`, {
      data: data ? (typeof data === 'object' ? JSON.stringify(data).substring(0, 200) + '...' : data) : 'No data'
    })

    try {
      const response = await withRetry(() => client.post(endpoint, data, config))

      console.log(`[WooCommerce] POST ${endpoint} successful`, {
        status: response.status,
        statusText: response.statusText
      })

      return response
    } catch (error) {
      console.error(`[WooCommerce] POST ${endpoint} failed:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      throw error
    }
  }

  const put = async (endpoint, data, config = {}) => {
    console.log(`[WooCommerce] PUT ${endpoint}`)

    try {
      const response = await withRetry(() => client.put(endpoint, data, config))

      console.log(`[WooCommerce] PUT ${endpoint} successful`)

      return response
    } catch (error) {
      console.error(`[WooCommerce] PUT ${endpoint} failed:`, error.message)
      throw error
    }
  }

  const del = async (endpoint, config = {}) => {
    console.log(`[WooCommerce] DELETE ${endpoint}`)

    try {
      const response = await withRetry(() => client.delete(endpoint, config))

      console.log(`[WooCommerce] DELETE ${endpoint} successful`)

      return response
    } catch (error) {
      console.error(`[WooCommerce] DELETE ${endpoint} failed:`, error.message)
      throw error
    }
  }

  // Webhook management
  const registerWebhooks = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const webhookUrl = `${baseUrl.replace(/\/+$/, '')}/api/webhooks/woocommerce`

      if (!webhookUrl.startsWith('http')) {
        throw new Error(`Invalid webhook URL: ${webhookUrl}`)
      }

      // First, verify the connection to WooCommerce
      try {
        await get('')
      } catch (error) {
        console.error('Failed to connect to WooCommerce:', error.message)
        throw new Error(`Failed to connect to WooCommerce: ${error.message}`)
      }

      const events = [
        'product.created',
        'product.updated',
        'product.deleted',
        'order.created',
        'order.updated',
        'customer.created',
        'customer.updated'
      ]

      const results = []
      let existingWebhooks = []

      try {
        // Get existing webhooks with error handling
        const response = await get('webhooks', { per_page: 100 })

        existingWebhooks = Array.isArray(response?.data) ? response.data : []
      } catch (error) {
        console.warn('Failed to fetch existing webhooks:', error.message)
      }

      // Create or update webhooks for each event
      for (const event of events) {
        try {
          const existingWebhook = existingWebhooks.find(
            webhook => webhook.topic === event && webhook.delivery_url === webhookUrl
          )

          const webhookData = {
            name: `Omnishop - ${event}`,
            topic: event,
            delivery_url: webhookUrl,
            secret: process.env.WOOCOMMERCE_WEBHOOK_SECRET || 'your-secret-key-here',
            status: 'active',
            api_version: 'wc/v3'  // Changed from wp/v2 to wc/v3
          }

          if (existingWebhook) {
            // Update existing webhook if needed
            const needsUpdate = Object.entries(webhookData).some(([key, value]) => existingWebhook[key] !== value)

            if (needsUpdate) {
              await put(`webhooks/${existingWebhook.id}`, webhookData)
              results.push(`Updated webhook for ${event}`)
            } else {
              results.push(`Webhook for ${event} already exists and is up to date`)
            }
          } else {
            // Create new webhook
            await post('webhooks', webhookData)
            results.push(`Created webhook for ${event}`)
          }
        } catch (error) {
          const errorMsg = error.response?.data?.message || error.message

          console.error(`Error processing webhook for ${event}:`, errorMsg)
          results.push(`Error (${event}): ${errorMsg}`)
        }
      }

      return {
        success: results.every(r => !r.startsWith('Error')),
        message: results.some(r => r.startsWith('Error'))
          ? 'Webhook registration completed with some errors'
          : 'Webhook registration completed successfully',
        details: results
      }
    } catch (error) {
      console.error('Webhook registration error:', error)
      throw new Error(`Failed to register webhooks: ${error.message}`)
    }
  }

  // Helper method to check connection
  const testConnection = async () => {
    try {
      const response = await get('system_status')

      return {
        success: true,
        storeName: response?.data?.environment?.site_wide_connection_encrypted
          ? '🔒 ' + response.data.environment.site_wide_connection_encrypted
          : '❌ Not encrypted',
        version: response?.data?.environment?.version,
        memoryLimit: response?.data?.environment?.wp_memory_limit
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data || {}
      }
    }
  }

  return Object.freeze({
    client,
    get,
    post,
    put,
    delete: del,
    registerWebhooks,
    testConnection,

    // Add version info for debugging
    version: '1.0.0'
  })
}

// Create and export a singleton instance
export const wooClient = createWooCommerceClient()

// Analytics client for wc-analytics endpoints
export function createWooAnalyticsClient() {
  const baseURL = process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL || process.env.WOO_STORE_URL
  const consumerKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY || process.env.WOOCOMMERCE_CONSUMER_KEY
  const consumerSecret = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET || process.env.WOOCOMMERCE_CONSUMER_SECRET

  if (!baseURL || !consumerKey || !consumerSecret) {
    throw new Error('Missing WooCommerce configuration')
  }

  const apiBaseURL = `${baseURL.replace(/\/+$/, '')}/wp-json/wc-analytics/`

  const client = axios.create({
    baseURL: apiBaseURL,
    auth: { username: consumerKey, password: consumerSecret },
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    timeout: 30000,
    validateStatus: s => s >= 200 && s < 500
  })

  return client
}

export async function getAnalytics(endpoint, params = {}) {
  const client = createWooAnalyticsClient()
  const res = await client.get(endpoint, { params })
  if (res.status >= 400) throw new Error(`Analytics GET ${endpoint} failed: ${res.status}`)
  return res.data
}

/**
 * Create a product in WooCommerce
 * @param {Object} productData - Product data to create
 * @returns {Promise<Object>} - The created product data
 */
export async function createWooCommerceProduct(productData) {
  try {
    console.log('[WooCommerce] Creating product with data:', JSON.stringify(productData, null, 2))

    // Ensure required fields are present
    const requiredFields = ['name', 'regular_price']
    const missingFields = requiredFields.filter(field => !productData[field])

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
    }

    // Ensure price is a string as required by WooCommerce
    const payload = {
      ...productData,
      regular_price: productData.regular_price.toString(),
      sale_price: productData.sale_price ? productData.sale_price.toString() : ''
    }

    console.log('[WooCommerce] Sending payload to WooCommerce:', JSON.stringify(payload, null, 2))

    const response = await wooClient.post('products', payload)

    if (!response.data || !response.data.id) {
      throw new Error('Invalid response from WooCommerce API: ' + JSON.stringify(response.data))
    }

    console.log('[WooCommerce] Product created successfully:', {
      id: response.data.id,
      name: response.data.name,
      status: response.data.status
    })

    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('[WooCommerce] Error creating product:', {
      message: error.message,
      code: error.code,
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data || 'No response data'
      },
      stack: error.stack
    })

    // Extract the most useful error message
    let errorMessage = 'Failed to create product in WooCommerce'
    let errorDetails = {}

    if (error.response?.data) {
      // WooCommerce REST API error format
      if (error.response.data.message) {
        errorMessage = error.response.data.message
      } else if (error.response.data.code) {
        errorMessage = `${error.response.data.code}: ${error.response.data.message || 'Unknown error'}`
      }

      // Include validation errors if present
      if (error.response.data.data && error.response.data.data.params) {
        errorDetails = error.response.data.data.params
      } else if (error.response.data.data) {
        errorDetails = error.response.data.data
      }
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
      details: errorDetails,
      status: error.response?.status || 500,
      code: error.code || 'INTERNAL_ERROR'
    }
  }
}

export default wooClient
