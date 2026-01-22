/**
 * src/WooRentalBridge.ts
 * Main Module Entry Point and Configuration
 */

import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api'

import { AuthenticationError, ResourceNotFoundError } from './errors'
import { ProductsService } from './services/ProductsService'
import { OrdersService } from './services/OrdersService'
import { CategoriesService } from './services/CategoriesService'
import { AnalyticsService } from './services/AnalyticsService'
import { CouponsService } from './services/CouponsService'
import { TaxesService } from './services/TaxesService'
import { RefundsService } from './services/RefundsService'
import { MetadataService } from './services/MetadataService'
import { OrderNotesService } from './services/OrderNotesService'
import { SettingsService } from './services/SettingsService'

// Force IPv4 DNS resolution globally at module load time
const dns = require('dns')

dns.setDefaultResultOrder('ipv4first')

export { AuthenticationError, ResourceNotFoundError }
export interface BridgeConfig {
  storeUrl: string
  consumerKey: string
  consumerSecret: string
  timeout?: number // Optional timeout
}

export class WooRentalBridge {
  private api: WooCommerceRestApi
  public readonly products: ProductsService
  public readonly orders: OrdersService
  public readonly categories: CategoriesService
  public readonly analytics: AnalyticsService
  public readonly coupons: CouponsService
  public readonly taxes: TaxesService
  public readonly refunds: RefundsService
  public readonly metadata: MetadataService
  public readonly orderNotes: OrderNotesService
  public readonly settings: SettingsService

  constructor(config: BridgeConfig) {
    if (!config.storeUrl || !config.consumerKey || !config.consumerSecret) {
      throw new AuthenticationError('Missing required configuration parameters for WooCommerce API connection.')
    }

    // Initialize the WooCommerce REST API client
    // Create custom HTTP(S) agents with IPv4 enforcement and connection tuning
    const dns = require('dns')
    const http = require('http')
    const https = require('https')

    // Force IPv4 DNS resolution
    const ipv4Lookup = (hostname: string, options: any, callback: any) => {
      dns.lookup(hostname, { family: 4, hints: dns.ADDRCONFIG }, (err: any, address: string, family: number) => {
        if (err) {
          console.warn(`IPv4 lookup failed for ${hostname}, falling back to default:`, err.message)

          return dns.lookup(hostname, options, callback)
        }

        callback(err, address, family)
      })
    }

    const httpAgent = new http.Agent({
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: 5,
      maxFreeSockets: 2,
      timeout: 25000,
      connectTimeout: 10000,
      lookup: ipv4Lookup,
      family: 4
    })

    const httpsAgent = new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: 5,
      maxFreeSockets: 2,
      timeout: 25000,
      connectTimeout: 10000,
      rejectUnauthorized: process.env.NODE_ENV === 'production',
      secureProtocol: 'TLSv1_2_method',
      ciphers: 'TLS_AES_256_GCM_SHA384:ECDHE-RSA-AES256-GCM-SHA384:!aNULL:!eNULL:!EXPORT',
      lookup: ipv4Lookup,
      family: 4
    })

this.api = new WooCommerceRestApi({
  url: config.storeUrl.replace(/\/$/, ''),
  consumerKey: config.consumerKey,
  consumerSecret: config.consumerSecret,
  version: 'wc/v3',
  queryStringAuth: true,
  timeout: config.timeout || 60000,
  axiosConfig: {
    httpAgent,
    httpsAgent,
    timeout: config.timeout || 60000,
    headers: {
      'User-Agent': 'WooRentalBridge/1.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
} as any)

    console.log(`WooRentalBridge initialized with IPv4-only DNS and ${config.timeout || 60000}ms timeout`)

    // Test the connection on initialization (non-blocking)
    this.testConnection()
      .then(() => console.log('✅ WooCommerce API connection successful'))
      .catch(err => console.warn('⚠️ Initial connection test failed:', err.message))

    // Initialize services
    this.products = new ProductsService(config.storeUrl, config.consumerKey, config.consumerSecret, config.timeout || 60000)
    this.orders = new OrdersService(config.storeUrl, config.consumerKey, config.consumerSecret, config.timeout || 60000)
    this.categories = new CategoriesService(config.storeUrl, config.consumerKey, config.consumerSecret, config.timeout || 60000)
    this.analytics = new AnalyticsService(this.api)
    this.coupons = new CouponsService(config.storeUrl, config.consumerKey, config.consumerSecret, config.timeout || 60000)
    this.taxes = new TaxesService(config.storeUrl, config.consumerKey, config.consumerSecret, config.timeout || 60000)
    this.refunds = new RefundsService(config.storeUrl, config.consumerKey, config.consumerSecret, config.timeout || 60000)
    this.metadata = new MetadataService(config.storeUrl, config.consumerKey, config.consumerSecret, config.timeout || 60000)
    this.orderNotes = new OrderNotesService(config.storeUrl, config.consumerKey, config.consumerSecret, config.timeout || 60000)
    this.settings = new SettingsService(config.storeUrl, config.consumerKey, config.consumerSecret, config.timeout || 60000)

    console.log(`WooRentalBridge connected to: ${config.storeUrl}`)
  }


  // Helper function to check basic connectivity

  private async checkBasicConnectivity(): Promise<boolean> {
    try {
      const url = new URL((this.api as any).url)
      const isHttps = url.protocol === 'https:'
      const port = parseInt(url.port || (isHttps ? '443' : '80'), 10)
      const transport = isHttps ? require('https') : require('http')

      return new Promise((resolve) => {
        const options = {
          hostname: url.hostname,
          port: port,
          path: '/',
          method: 'HEAD',
          timeout: 10000,
          rejectUnauthorized: false,
          agent: false
        }

        console.log(`\n🌐 Testing connection to ${url.hostname}:${port}...`)

        const req = transport.request(options, (res: any) => {
          console.log(`✅ Server responded with status: ${res.statusCode}`)
          res.on('data', () => {})
          res.on('end', () => resolve(true))
        })

        req.on('error', (error: Error) => {
          console.error('Connection error:', error.message)
          resolve(false)
        })

        req.on('timeout', () => {
          console.error('Connection timed out')
          req.destroy()
          resolve(false)
        })

        req.end()
      })
    } catch (error) {
      console.error('Error in checkBasicConnectivity:', error)
      
      return false
    }
  }

    private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        console.warn(`Attempt ${attempt} failed:`, error)

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000) // Exponential backoff, max 10s
          
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Unknown error occurred')
  }

  // Consolidated connection test implementation
  async testConnection(maxRetries = 3, currentAttempt = 1): Promise<boolean> {
    const endpoint = '/wp-json/wc/v3/system_status'
    const timeoutMs = (this.api as any)?.axiosConfig?.timeout || 60000

    try {
      await this.withRetry(async () => {
        const response = await this.api.get(endpoint, {
          timeout: timeoutMs,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Accept': 'application/json'
          }
        })

        if (response.status !== 200) {
          throw new Error(`Unexpected status code: ${response.status}`)
        }
      }, maxRetries)

      return true
    } catch (error: any) {
      console.error('Connection test failed after retries:', error)
      
      return false
    }
  }

  /**
   * Test the connection to the WooCommerce API (alias maintained)
   */
  async testConnectionAlias(maxRetries = 3, currentAttempt = 1): Promise<boolean> {
    return this.testConnection(maxRetries, currentAttempt)
  }

  // A utility method to test the connection
  public async checkConnection(): Promise<boolean> {
    try {
      // Attempt to retrieve a list of orders or check system status
      await this.api.get('system_status')

      return true
    } catch (error) {
      throw new AuthenticationError(
        `Failed to connect or authenticate with WooCommerce API: ${error instanceof Error ? error.message : 'Unknown error'}. Check storeUrl, consumerKey, and consumerSecret.`
      )
    }
  }
}

// Export WooRentalBridge as default export
export default WooRentalBridge
