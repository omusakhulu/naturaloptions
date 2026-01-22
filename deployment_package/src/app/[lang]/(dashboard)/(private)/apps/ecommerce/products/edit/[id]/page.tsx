'use client'

import { useEffect, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'

import { toast } from 'react-toastify'

import { ProductEditForm } from './ProductEditForm'

interface ProductData {
  id: string
  wooId: number
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  price: string | null
  regularPrice: string | null
  salePrice: string | null
  stockStatus: string
  stockQuantity: number
  sku: string | null
  image: string | null
  images: string
  categories: string
  rating: number
  ratingCount: number
  status: string
  syncedAt: string
  [key: string]: any // For any additional properties
}

export default function ProductEditPage() {
  const params = useParams()
  const router = useRouter()
  const lang = Array.isArray((params as any)?.lang) ? (params as any).lang[0] : ((params as any)?.lang || 'en')
  const [productData, setProductData] = useState<ProductData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProduct = async () => {
      try {
        if (!params?.id) {
          setError('Product ID is missing')
          setIsLoading(false)

          return
        }

        const productId = Array.isArray(params.id) ? params.id[0] : params.id
        const response = await fetch(`/api/products/${productId}`)

        if (!response.ok) {
          const errorData = await response.json()

          throw new Error(errorData.error || 'Failed to fetch product')
        }

        const { data: product } = await response.json()

        if (!product) {
          setError('Product not found')
          setIsLoading(false)

          return
        }

        setProductData(product)
      } catch (err) {
        console.error('Error loading product:', err)
        setError('Failed to load product. Please try again.')
        toast.error('Failed to load product')
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [params?.id])

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4'></div>
          <p>Loading product data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='bg-red-50 border-l-4 border-red-400 p-4 my-4'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <p className='text-sm text-red-700'>{error}</p>
            <button onClick={() => router.back()} className='mt-2 text-sm text-red-600 hover:text-red-500'>
              ← Go back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!productData) {
    return (
      <div className='text-center py-12'>
        <svg className='mx-auto h-12 w-12 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={1}
            d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
        <h3 className='mt-2 text-sm font-medium text-gray-900'>No product found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <div className='mt-6'>
          <button
            onClick={() => router.push(`/${lang}/apps/ecommerce/products/list`)}
            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
            Back to products
          </button>
        </div>
      </div>
    )
  }

  // Prepare the initial product data for the form
  const initialProduct = {
    id: parseInt(productData.id),
    name: productData.name,
    slug: productData.slug,
    sku: productData.sku || '',
    price: productData.price || '0',
    regular_price: productData.regularPrice || '0',
    sale_price: productData.salePrice || '0',
    stock_status: (productData.stockStatus as 'instock' | 'outofstock' | 'onbackorder') || 'instock',
    stock_quantity: productData.stockQuantity || 0,

    // Only include additional properties that don't conflict with the ones above
    ...Object.fromEntries(
      Object.entries(productData).filter(
        ([key]) => ![
          'id',
          'name',
          'slug',
          'sku',
          'price',
          'regularPrice',
          'salePrice',
          'stockStatus',
          'stockQuantity'
        ].includes(key)
      )
    )
  }

  return <ProductEditForm productId={productData.id} initialProduct={initialProduct} />
}
