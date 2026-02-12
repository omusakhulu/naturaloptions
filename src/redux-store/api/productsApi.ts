import { baseApi } from './baseApi'

export const productsApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getProducts: builder.query<any, { take?: number } | void>({
      query: params => ({
        url: '/products/list',
        params: params || undefined
      }),
      providesTags: ['Products']
    }),
    getProductById: builder.query<any, string>({
      query: id => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Products', id }]
    }),
    updateProduct: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Products', id }, 'Products']
    })
  })
})

export const { useGetProductsQuery, useGetProductByIdQuery, useUpdateProductMutation } = productsApi
