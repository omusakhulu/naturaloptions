import { AxiosInstance } from 'axios'
import { ApiError } from '../errors'
import { createAxiosClient } from '../utils/axios-helper'

export class SettingsService {
  private axiosClient: AxiosInstance

  constructor(storeUrl: string, consumerKey: string, consumerSecret: string, timeout: number = 60000) {
    this.axiosClient = createAxiosClient(storeUrl, consumerKey, consumerSecret, timeout)
  }

  async listSettingsGroups() {
    try {
      const response = await this.axiosClient.get('settings')
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async getSettingsByGroup(groupId: string) {
    try {
      const response = await this.axiosClient.get(`settings/${groupId}`)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  async updateSetting(groupId: string, id: string, data: any) {
    try {
      const response = await this.axiosClient.put(`settings/${groupId}/${id}`, data)
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  private handleError(error: any): Error {
    const status = error.response?.status || 0
    const data = error.response?.data
    const message = data?.message || error.message || 'An error occurred with Settings API'
    return new ApiError(message, status, data)
  }
}
