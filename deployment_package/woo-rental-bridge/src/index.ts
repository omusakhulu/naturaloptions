// src/WooRentalBridge.ts
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api'
import dotenv from 'dotenv'

import { ProductsService } from './services/ProductsService'

// Import the error classes correctly
import { ApiError, AuthenticationError, ResourceNotFoundError, WooRentalBridgeError } from './errors'

// import { OrdersService } from './services/OrdersService'; // Commented out - Not created yet
// import { AnalyticsService } from './services/AnalyticsService'; // Commented out - Not created yet

// Load environment variables
dotenv.config()

export interface WooRentalBridgeConfig {
  storeUrl: string
  consumerKey: string
  consumerSecret: string
  timeout?: number // Timeout in milliseconds
  apiVersion?: 'wc/v3' // Or specific version if needed
}

export class WooRentalBridge {
  private api: WooCommerceRestApi
  public products: ProductsService

  // public orders: OrdersService; // Commented out - Not created yet
  // public analytics: AnalyticsService; // Commented out - Not created yet

  constructor(config: WooRentalBridgeConfig) {
    if (!config.storeUrl || !config.consumerKey || !config.consumerSecret) {
      // Correct: Call with one argument
      throw new AuthenticationError(
        'Missing required configuration: storeUrl, consumerKey, and consumerSecret must be provided.'
      )
    }

    try {
      this.api = new WooCommerceRestApi({
        url: config.storeUrl,
        consumerKey: config.consumerKey,
        consumerSecret: config.consumerSecret,
        version: config.apiVersion || 'wc/v3',
        queryStringAuth: true, // Recommended for reliability
        timeout: config.timeout || 60000
      })
    } catch (error: any) {
      // Use the imported WooRentalBridgeError
      // Correct: The error on line 61 mentioned in the error log likely refers to an AuthenticationError call elsewhere,
      // potentially outside the constructor or handleApiCall if modifications were made.
      // Assuming the error might actually be related to the initial credential check failure:
      // Let's re-wrap the initialization in a try-catch for AuthenticationError potential.
      // However, the original code structure handles missing config *before* initialization.
      // The most likely place for the TS2554 error based on line number 61 from your log
      // is *within* the handleApiCall method or a similar error handling block if modified.
      // Let's ensure handleApiCall remains correct:
      throw new WooRentalBridgeError(`Failed to initialize WooCommerce API client: ${error.message}`)
    }

    // Initialize services
    this.products = new ProductsService(config.storeUrl, config.consumerKey, config.consumerSecret, config.timeout || 60000)

    // this.orders = new OrdersService(this.api); // Commented out - Not created yet
    // this.analytics = new AnalyticsService(this.api); // Commented out - Not created yet

    console.log('WooRentalBridge initialized successfully.')
  }

  /**
   * Helper function to handle potential API errors from the client library.
   * Ensures consistent error types are thrown.
   * @param promise The promise returned by the WooCommerce API client method.
   * @returns The data from the API response.
   * @throws {ApiError | AuthenticationError | ResourceNotFoundError | WooRentalBridgeError} If the API returns an error.
   */
  public async handleApiCall<T>(promise: Promise<{ status: number; data: T; headers?: any }>): Promise<T> {
    try {
      const response = await promise

      if (response.data && typeof response.data === 'object' && 'code' in response.data && 'message' in response.data) {
        // @ts-ignore
        throw new ApiError(response.data.message, response.status, response.data)
      }

      return response.data
    } catch (error: any) {
      if (
        error instanceof ApiError ||
        error instanceof AuthenticationError ||
        error instanceof ResourceNotFoundError ||
        error instanceof WooRentalBridgeError
      ) {
        throw error
      }

      if (error.response) {
        if (error.response.status === 401 || error.response.data?.code?.includes('authentication')) {
          // Correct: Ensure AuthenticationError is called with only one argument (message)
          throw new AuthenticationError(error.response.data?.message || 'Invalid API credentials.') // This is the likely location for TS2554 if line 61 was inaccurate in the log relative to the provided code.
        }

        if (error.response.status === 404) {
          throw new ResourceNotFoundError(error.response.data?.message || 'Resource not found')
        }

        throw new ApiError(
          error.response.data?.message || `Request failed with status ${error.response.status}`,
          error.response.status,
          error.response.data
        )
      } else if (error.request) {
        throw new ApiError('No response received from the API.', 0, {
          requestDetails: 'Request made but no response'
        })
      } else {
        throw new WooRentalBridgeError(`Request setup failed: ${error.message}`)
      }
    }
  }
}

// Export the WooRentalBridge class as default export
export default WooRentalBridge
