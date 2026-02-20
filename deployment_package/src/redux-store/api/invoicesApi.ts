import { baseApi } from './baseApi'

export const invoicesApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getInvoices: builder.query<any, { take?: number } | void>({
      query: params => ({
        url: '/invoices',
        params: params || undefined
      }),
      providesTags: ['Invoices']
    }),
    getInvoiceById: builder.query<any, string>({
      query: id => `/invoices/${id}`,
      providesTags: (result, error, id) => [{ type: 'Invoices', id }]
    })
  })
})

export const { useGetInvoicesQuery, useGetInvoiceByIdQuery } = invoicesApi
