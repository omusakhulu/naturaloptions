import { AxiosInstance } from 'axios'
import { ApiError, ResourceNotFoundError } from '../errors'
import { createAxiosClient } from '../utils/axios-helper'

export class MetadataService {
  private axiosClient: AxiosInstance

  constructor(storeUrl: string, consumerKey: string, consumerSecret: string, timeout: number = 60000) {
    this.axiosClient = createAxiosClient(storeUrl, consumerKey, consumerSecret, timeout)
  }

  // Attributes
  async listAttributes() {
    try {
      const response = await this.axiosClient.get('products/attributes')
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async getAttributeById(id: number) {
    try {
      const response = await this.axiosClient.get(`products/attributes/${id}`)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Tags
  async listTags(params?: any) {
    try {
      const response = await this.axiosClient.get('products/tags', { params })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  // Shipping Classes
  async listShippingClasses(params?: any) {
    try {
      const response = await this.axiosClient.get('products/shipping_classes', { params })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  private handleError(error: any): Error {
    const status = error.response?.status || 0
    const data = error.response?.data
    const message = data?.message || error.message || 'An error occurred with Metadata API'
    return new ApiError(message, status, data)
  }
}
