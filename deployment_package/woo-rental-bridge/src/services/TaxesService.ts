import { AxiosInstance } from 'axios'
import { ApiError } from '../errors'
import { createAxiosClient } from '../utils/axios-helper'

export class TaxesService {
  private axiosClient: AxiosInstance

  constructor(storeUrl: string, consumerKey: string, consumerSecret: string, timeout: number = 60000) {
    this.axiosClient = createAxiosClient(storeUrl, consumerKey, consumerSecret, timeout)
  }

  async listTaxRates(params?: any) {
    try {
      const response = await this.axiosClient.get('taxes', { params })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async listTaxClasses() {
    try {
      const response = await this.axiosClient.get('taxes/classes')
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async createTaxRate(data: any) {
    try {
      const response = await this.axiosClient.post('taxes', data)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  private handleError(error: any): Error {
    const status = error.response?.status || 0
    const data = error.response?.data
    const message = data?.message || error.message || 'An error occurred with Taxes API'
    return new ApiError(message, status, data)
  }
}
