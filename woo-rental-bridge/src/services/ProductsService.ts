import dns from 'dns'
import http from 'http'
import https from 'https'

import axios from 'axios'
import type { AxiosInstance } from 'axios'

import { ApiError, ResourceNotFoundError, WooRentalBridgeError } from '../errors'

export class ProductsService {
  private axiosClient: AxiosInstance

  constructor(storeUrl: string, consumerKey: string, consumerSecret: string, timeout: number = 60000) {
    // Create custom HTTP(S) agents with IPv4 enforcement
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
      lookup: ipv4Lookup,
      family: 4
    } as any)

    const httpsAgent = new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxSockets: 5,
      maxFreeSockets: 2,
      timeout: 25000,
      rejectUnauthorized: process.env.NODE_ENV === 'production',
      lookup: ipv4Lookup,
      family: 4
    } as any)

    // Create axios instance with proper base URL and agents
    this.axiosClient = axios.create({
      baseURL: `${storeUrl.replace(/\/$/, '')}/wp-json/wc/v3`,
      timeout: timeout,
      httpAgent,
      httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WooRentalBridge/1.0'
      },
      auth: {
        username: consumerKey,
        password: consumerSecret
      }
    })
  }

  /**
   * List all products with pagination support
   * @param params Optional query parameters (status, per_page, orderby, order, etc.)
   */
  async listProducts(params?: any) {
    try {
      const response = await this.axiosClient.get('products', { params })

      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Get all products
   * @param params Optional query parameters
   */
  async getProducts(params?: any) {
    try {
      const response = await this.axiosClient.get('products', { params })

      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Get a single product by ID
   * @param id Product ID
   */
  async getProductById(id: number) {
    try {
      const response = await this.axiosClient.get(`products/${id}`)

      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new ResourceNotFoundError('Product', id)
      }

      throw this.handleError(error)
    }
  }

  /**
   * Create a new product
   * @param productData Product data
   */
  async createProduct(productData: any) {
    try {
      const response = await this.axiosClient.post('products', productData)

      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Update a product
   * @param id Product ID
   * @param productData Updated product data
   */
  async updateProduct(id: number, productData: any) {
    try {
      const response = await this.axiosClient.put(`products/${id}`, productData)

      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new ResourceNotFoundError('Product', id)
      }

      throw this.handleError(error)
    }
  }

  /**
   * Delete a product
   * @param id Product ID
   * @param force Whether to permanently delete the product (default: false)
   */
  async deleteProduct(id: number, force = false) {
    try {
      const response = await this.axiosClient.delete(`products/${id}`, { params: { force } })

      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new ResourceNotFoundError('Product', id)
      }

      throw this.handleError(error)
    }
  }

  /**
   * Handle API errors
   * @private
   */
  private handleError(error: any): Error {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response
      const message = data?.message || 'An error occurred while processing your request'
      
      if (status === 401 || status === 403) {
        return new ApiError('Authentication failed', status, data, {
          code: 'AUTHENTICATION_ERROR'
        })
      }

      return new ApiError(message, status, data)
    } else if (error.request) {
      // The request was made but no response was received
      return new WooRentalBridgeError('No response received from the server', {
        code: 'NO_RESPONSE'
      })
    } else {
      // Something happened in setting up the request that triggered an Error
      return new WooRentalBridgeError(error.message, {
        code: 'REQUEST_ERROR'
      })
    }
  }
}

export default ProductsService
