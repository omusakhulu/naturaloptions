import { baseApi } from './baseApi'

export const ordersApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getOrders: builder.query<any, { q?: string; take?: number; deliverable?: string } | void>({
      query: params => ({
        url: '/orders',
        params: params || undefined
      }),
      providesTags: ['Orders']
    }),
    getOrderById: builder.query<any, string>({
      query: id => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Orders', id }]
    })
  })
})

export const { useGetOrdersQuery, useGetOrderByIdQuery } = ordersApi
