import dns from 'dns'
import http from 'http'
import https from 'https'

import axios from 'axios'
import type { AxiosInstance } from 'axios'

import { ApiError, ResourceNotFoundError, WooRentalBridgeError } from '../errors'

export class OrdersService {
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
      auth: {
        username: consumerKey,
        password: consumerSecret
      },
      httpAgent,
      httpsAgent,
      timeout
    })
  }

  /**
   * List orders from WooCommerce
   */
  public async listOrders(params: any = {}) {
    try {
      const response = await this.axiosClient.get('orders', { params })

      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new ResourceNotFoundError('Orders not found')
      }

      throw new ApiError(
        error.response?.data?.message || error.message,
        error.response?.status || 0,
        error.response?.data
      )
    }
  }

  /**
   * Get a single order
   */
  public async getOrder(orderId: number) {
    try {
      const response = await this.axiosClient.get(`orders/${orderId}`)

      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new ResourceNotFoundError(`Order ${orderId} not found`)
      }

      throw new ApiError(
        error.response?.data?.message || error.message,
        error.response?.status || 0,
        error.response?.data
      )
    }
  }

  /**
   * Create an order
   */
  public async createOrder(orderData: any) {
    try {
      const response = await this.axiosClient.post('orders', orderData)

      return response.data
    } catch (error: any) {
      throw new ApiError(
        error.response?.data?.message || error.message,
        error.response?.status || 0,
        error.response?.data
      )
    }
  }

  /**
   * Update an order
   */
  public async updateOrder(orderId: number, orderData: any) {
    try {
      const response = await this.axiosClient.put(`orders/${orderId}`, orderData)

      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new ResourceNotFoundError(`Order ${orderId} not found`)
      }

      throw new ApiError(
        error.response?.data?.message || error.message,
        error.response?.status || 0,
        error.response?.data
      )
    }
  }

  /**
   * Delete an order
   */
  public async deleteOrder(orderId: number) {
    try {
      const response = await this.axiosClient.delete(`orders/${orderId}`)

      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new ResourceNotFoundError(`Order ${orderId} not found`)
      }

      throw new ApiError(
        error.response?.data?.message || error.message,
        error.response?.status || 0,
        error.response?.data
      )
    }
  }

  /**
   * List customers
   */
  public async listCustomers(params: any = {}) {
    try {
      const response = await this.axiosClient.get('customers', { params })

      return response.data
    } catch (error: any) {
      throw new ApiError(
        error.response?.data?.message || error.message,
        error.response?.status || 0,
        error.response?.data
      )
    }
  }
}
