import { AxiosInstance } from 'axios'
import { ApiError, ResourceNotFoundError, WooRentalBridgeError } from '../errors'
import { createAxiosClient } from '../utils/axios-helper'

export class ProductsService {
  private axiosClient: AxiosInstance

  constructor(storeUrl: string, consumerKey: string, consumerSecret: string, timeout: number = 60000) {
    this.axiosClient = createAxiosClient(storeUrl, consumerKey, consumerSecret, timeout)
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
   * Batch update products
   * @param data { create: [], update: [], delete: [] }
   */
  async batchUpdateProducts(data: { create?: any[]; update?: any[]; delete?: number[] }) {
    try {
      const response = await this.axiosClient.post('products/batch', data)
      return response.data
    } catch (error: any) {
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
