// src/client.ts (Simplified Example)
import crypto from 'crypto'

// Import types separately to avoid type issues
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import axios, { isAxiosError } from 'axios'
import OAuth from 'oauth-1.0a'

import { WooRentalBridgeConfig } from './config'
import { AuthenticationError } from './errors'

// Extend Axios types
declare module 'axios' {
  interface AxiosRequestConfig {
    oauth?: boolean
  }
}

export class ApiClient {
  private client: AxiosInstance
  private oauth: OAuth
  private consumerKey: string
  private consumerSecret: string
  private storeUrl: string

  constructor(config: WooRentalBridgeConfig) {
    this.storeUrl = config.storeUrl
    this.consumerKey = config.consumerKey
    this.consumerSecret = config.consumerSecret

    this.client = axios.create({
      baseURL: `${this.storeUrl}/wp-json/wc/v3`,
      timeout: config.timeout || 60000,
      headers: { 'Content-Type': 'application/json' }
    })

    this.oauth = new OAuth({
      consumer: { key: this.consumerKey, secret: this.consumerSecret },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto.createHmac('sha1', key).update(base_string).digest('base64')
      }
    })
  }

  private getAuthHeaders(method: string, url: string, params?: any): Record<string, string> {
    // Try Basic Auth first
    if (process.env.WOO_AUTH_METHOD === 'basic') {
      const token = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64')

      return {
        Authorization: `Basic ${token}`,
        'Content-Type': 'application/json'
      }
    }

    // Fall back to OAuth
    const requestData = {
      url: `${this.storeUrl}/wp-json/wc/v3/${url}`,
      method: method.toUpperCase(),
      data: params || {}
    }

    try {
      const authHeaders = this.oauth.toHeader(this.oauth.authorize(requestData))

      return Object.fromEntries(Object.entries(authHeaders).map(([key, value]) => [key, String(value)]))
    } catch (error) {
      console.error('OAuth Error:', error)
      throw new AuthenticationError('Failed to generate OAuth signature.')
    }
  }

  async request<T>(method: string, endpoint: string, data?: unknown, params?: unknown): Promise<T> {
    console.log(`[ApiClient] Preparing ${method} request to ${endpoint}`)

    const fullUrl = params
      ? `${endpoint}?${new URLSearchParams(params as Record<string, string>).toString()}`
      : endpoint

    // Log request details
    console.log(`[ApiClient] Request details:`, {
      method,
      endpoint,
      fullUrl,
      hasParams: !!params,
      hasData: !!data,
      authMethod: process.env.WOO_AUTH_METHOD || 'basic'
    })

    try {
      const authHeaders = this.getAuthHeaders(
        method,
        fullUrl,
        method === 'POST' || method === 'PUT' ? (data as Record<string, unknown>) : undefined
      )

      const config: AxiosRequestConfig = {
        method,
        url: endpoint,
        headers: {
          ...authHeaders,
          'Cache-Control': 'no-cache',
          Accept: 'application/json'
        },
        params: method === 'GET' || method === 'DELETE' ? params : undefined,
        data: method === 'POST' || method === 'PUT' ? data : undefined,
        timeout: this.client.defaults.timeout,
        validateStatus: status => status >= 200 && status < 500
      }

      console.log(`[ApiClient] Sending request to ${endpoint}`)
      const response = await this.client.request<T>(config)

      console.log(`[ApiClient] Received response with status ${response.status}`)

      // Log response headers for debugging
      if (response.headers) {
        console.log('[ApiClient] Response headers:', {
          'x-wp-total': response.headers['x-wp-total'],
          'x-wp-totalpages': response.headers['x-wp-totalpages'],
          'content-type': response.headers['content-type']
        })
      }

      // Handle non-2xx responses
      if (response.status < 200 || response.status >= 300) {
        // Safely handle the error message from response data
        const errorData = response.data as any

        const errorMessage =
          typeof errorData === 'object' && errorData !== null && 'message' in errorData
            ? String(errorData.message)
            : `Request failed with status ${response.status}`

        console.error(`[ApiClient] API Error:`, {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          config: {
            url: config.url,
            method: config.method,
            params: config.params
          }
        })
        throw new Error(errorMessage)
      }

      return response.data
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        // TODO: Map Axios errors (4xx, 5xx) to custom errors
        console.error(`API Error ${error.response?.status}: ${error.message}`, error.response?.data)
        throw new Error(`API Request Failed: ${error.message}`)
      }

      throw error
    }
  }

  // TODO: Add method to handle pagination automatically (e.g., fetchAllPages)
  // This typically involves checking response headers like 'X-WP-TotalPages'
  // and making subsequent requests with the 'page' parameter.
}
