import { AxiosInstance } from 'axios'
import { ApiError, ResourceNotFoundError } from '../errors'
import { createAxiosClient } from '../utils/axios-helper'

export class CouponsService {
  private axiosClient: AxiosInstance

  constructor(storeUrl: string, consumerKey: string, consumerSecret: string, timeout: number = 60000) {
    this.axiosClient = createAxiosClient(storeUrl, consumerKey, consumerSecret, timeout)
  }

  async listCoupons(params?: any) {
    try {
      const response = await this.axiosClient.get('coupons', { params })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async getCouponById(id: number) {
    try {
      const response = await this.axiosClient.get(`coupons/${id}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new ResourceNotFoundError('Coupon', id)
      }
      throw this.handleError(error)
    }
  }

  async createCoupon(data: any) {
    try {
      const response = await this.axiosClient.post('coupons', data)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async updateCoupon(id: number, data: any) {
    try {
      const response = await this.axiosClient.put(`coupons/${id}`, data)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async deleteCoupon(id: number, force = false) {
    try {
      const response = await this.axiosClient.delete(`coupons/${id}`, { params: { force } })
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  private handleError(error: any): Error {
    const status = error.response?.status || 0
    const data = error.response?.data
    const message = data?.message || error.message || 'An error occurred with Coupons API'
    return new ApiError(message, status, data)
  }
}
