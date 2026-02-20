import { baseApi } from './baseApi'

export const customersApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getCustomers: builder.query<any, { take?: number } | void>({
      query: params => ({
        url: '/customers',
        params: params || undefined
      }),
      providesTags: ['Customers']
    }),
    getCustomerById: builder.query<any, string>({
      query: id => `/customers?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'Customers', id }]
    }),
    createCustomer: builder.mutation<any, Record<string, any>>({
      query: body => ({
        url: '/customers',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Customers']
    }),
    updateCustomer: builder.mutation<any, Record<string, any>>({
      query: body => ({
        url: '/customers',
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Customers']
    })
  })
})

export const { useGetCustomersQuery, useGetCustomerByIdQuery, useCreateCustomerMutation, useUpdateCustomerMutation } =
  customersApi
