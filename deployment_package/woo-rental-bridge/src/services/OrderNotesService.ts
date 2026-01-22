import { AxiosInstance } from 'axios'
import { ApiError, ResourceNotFoundError } from '../errors'
import { createAxiosClient } from '../utils/axios-helper'

export class OrderNotesService {
  private axiosClient: AxiosInstance

  constructor(storeUrl: string, consumerKey: string, consumerSecret: string, timeout: number = 60000) {
    this.axiosClient = createAxiosClient(storeUrl, consumerKey, consumerSecret, timeout)
  }

  async listOrderNotes(orderId: number, params?: any) {
    try {
      const response = await this.axiosClient.get(`orders/${orderId}/notes`, { params })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async createOrderNote(orderId: number, data: any) {
    try {
      const response = await this.axiosClient.post(`orders/${orderId}/notes`, data)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async deleteOrderNote(orderId: number, noteId: number, force = false) {
    try {
      const response = await this.axiosClient.delete(`orders/${orderId}/notes/${noteId}`, { params: { force } })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  private handleError(error: any): Error {
    const status = error.response?.status || 0
    const data = error.response?.data
    const message = data?.message || error.message || 'An error occurred with Order Notes API'
    return new ApiError(message, status, data)
  }
}
