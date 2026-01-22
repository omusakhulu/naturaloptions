import { AxiosInstance } from 'axios'
import { ApiError, ResourceNotFoundError } from '../errors'
import { createAxiosClient } from '../utils/axios-helper'

export class RefundsService {
  private axiosClient: AxiosInstance

  constructor(storeUrl: string, consumerKey: string, consumerSecret: string, timeout: number = 60000) {
    this.axiosClient = createAxiosClient(storeUrl, consumerKey, consumerSecret, timeout)
  }

  async listRefunds(orderId: number, params?: any) {
    try {
      const response = await this.axiosClient.get(`orders/${orderId}/refunds`, { params })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async getRefundById(orderId: number, refundId: number) {
    try {
      const response = await this.axiosClient.get(`orders/${orderId}/refunds/${refundId}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new ResourceNotFoundError('Refund', refundId)
      }
      throw this.handleError(error)
    }
  }

  async createRefund(orderId: number, data: any) {
    try {
      const response = await this.axiosClient.post(`orders/${orderId}/refunds`, data)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async deleteRefund(orderId: number, refundId: number, force = false) {
    try {
      const response = await this.axiosClient.delete(`orders/${orderId}/refunds/${refundId}`, { params: { force } })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  private handleError(error: any): Error {
    const status = error.response?.status || 0
    const data = error.response?.data
    const message = data?.message || error.message || 'An error occurred with Refunds API'
    return new ApiError(message, status, data)
  }
}
