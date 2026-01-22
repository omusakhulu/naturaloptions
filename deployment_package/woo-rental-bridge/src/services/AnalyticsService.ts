import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api'
import { ApiError } from '../errors'

export class AnalyticsService {
  private api: WooCommerceRestApi

  constructor(api: WooCommerceRestApi) {
    this.api = api
  }

  async getSalesReport(params?: any) {
    try {
      const response = await this.api.get('reports/sales', params)
      return response.data
    } catch (error: any) {
      throw new ApiError(error.response?.data?.message || error.message, error.response?.status || 0, error.response?.data)
    }
  }

  async getTopSellersReport(params?: any) {
    try {
      const response = await this.api.get('reports/top_sellers', params)
      return response.data
    } catch (error: any) {
      throw new ApiError(error.response?.data?.message || error.message, error.response?.status || 0, error.response?.data)
    }
  }

  async getStockReports(params?: any) {
    try {
      const response = await this.api.get('reports/stock', params)
      return response.data
    } catch (error: any) {
      throw new ApiError(error.response?.data?.message || error.message, error.response?.status || 0, error.response?.data)
    }
  }
}
