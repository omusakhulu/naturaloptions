'use client'

import { useState, useEffect, useMemo } from 'react'

import { useParams, useRouter } from 'next/navigation'

import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import {
  Box,
  Button,
  CircularProgress,
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel
} from '@mui/material'
import Grid from '@mui/material/Grid'
import Autocomplete from '@mui/material/Autocomplete'
import SaveIcon from '@mui/icons-material/SaveAlt'

import ProductAddHeader from '@views/apps/ecommerce/products/add/ProductAddHeader'
import MediaUploader, { type UploadedMedia } from '@/components/products/MediaUploader'

// Save product is now handled via API route

type StockStatus = 'instock' | 'outofstock' | 'onbackorder'

interface ProductFormData {
  name: string
  sku: string
  price: string | number
  regular_price: string | number
  sale_price: string | number
  stock_status: StockStatus
  stock_quantity: string | number

  // General
  description?: string
  short_description?: string
  status?: string
  catalog_visibility?: 'visible' | 'catalog' | 'search' | 'hidden'

  // Pricing
  date_on_sale_from?: string
  date_on_sale_to?: string

  // Inventory
  manage_stock?: boolean
  backorders?: 'no' | 'notify' | 'yes'
  low_stock_amount?: string | number
  sold_individually?: boolean

  // Shipping
  weight?: string | number
  length?: string | number
  width?: string | number
  height?: string | number
  shipping_class?: string

  // Taxonomy
  categories_csv?: string // comma-separated category IDs
  tags_csv?: string // comma-separated tag IDs
}

interface ProductCategory {
  id: number
  name: string
  slug?: string
}

interface ProductImage {
  id?: number
  src?: string
  url?: string
  name?: string
}

interface ProductDimensions {
  length?: string
  width?: string
  height?: string
}

interface Product {
  id: number
  name: string
  slug: string
  sku: string
  price: string
  regular_price: string
  sale_price: string
  stock_status: StockStatus
  stock_quantity: number
  status?: string
  type?: string
  description?: string
  short_description?: string
  catalog_visibility?: 'visible' | 'catalog' | 'search' | 'hidden'
  manage_stock?: boolean
  backorders?: 'no' | 'notify' | 'yes'
  low_stock_amount?: string | number
  sold_individually?: boolean
  weight?: string | number
  dimensions?: ProductDimensions
  shipping_class?: string
  images?: ProductImage[] | string
  categories?: ProductCategory[]
}

interface ProductEditFormProps {
  productId: string
  initialProduct: Product | null
}

export const ProductEditForm: React.FC<ProductEditFormProps> = ({ productId, initialProduct }) => {
  const router = useRouter()
  const params = useParams()
  const langParam = params?.lang
  const lang = Array.isArray(langParam) ? langParam[0] : langParam || 'en'
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [media, setMedia] = useState<UploadedMedia[]>([])
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
  const [tags, setTags] = useState<Array<{ id: number; name: string }>>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])

  const [upsellOptions, setUpsellOptions] = useState<
    Array<{ id: string; wooId: number | null; name: string; sku: string | null }>
  >([])

  const [crossSellOptions, setCrossSellOptions] = useState<
    Array<{ id: string; wooId: number | null; name: string; sku: string | null }>
  >([])

  const [selectedUpsells, setSelectedUpsells] = useState<
    Array<{ id: string; wooId: number | null; name: string; sku: string | null }>
  >([])

  const [selectedCrossSells, setSelectedCrossSells] = useState<
    Array<{ id: string; wooId: number | null; name: string; sku: string | null }>
  >([])

  // Attributes & Terms
  type WooAttribute = { id: number; name: string; slug: string }
  type WooTerm = { id: number; name: string; slug: string }
  const [wooAttributes, setWooAttributes] = useState<WooAttribute[]>([])
  const [termsByAttr, setTermsByAttr] = useState<Record<number, WooTerm[]>>({})

  const [selectedAttrs, setSelectedAttrs] = useState<
    Array<{ attrId: number | null; termIds: number[]; visible: boolean; variation: boolean }>
  >([{ attrId: null, termIds: [], visible: true, variation: false }])

  // Variations state
  const [variations, setVariations] = useState<
    Array<{
      id?: number
      key: string
      attributes: Array<{ id: number; name: string; option: string }>
      sku?: string
      regular_price?: string
      sale_price?: string
      manage_stock?: boolean
      stock_quantity?: number
      stock_status?: 'instock' | 'outofstock' | 'onbackorder'
    }>
  >([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ProductFormData>()

  // Set form values when initialProduct changes
  useEffect(() => {
    if (initialProduct) {
      setValue('name', initialProduct.name || '')
      setValue('sku', initialProduct.sku || '')
      setValue('regular_price', initialProduct.regular_price || '')
      setValue('sale_price', initialProduct.sale_price || '')
      setValue('stock_status', initialProduct.stock_status || 'instock')
      setValue('stock_quantity', initialProduct.stock_quantity || 0)
      setValue('description', initialProduct.description || '')
      setValue('short_description', initialProduct.short_description || '')
      setValue('status', initialProduct.status || 'publish')
      setValue('catalog_visibility', initialProduct.catalog_visibility || 'visible')
      setValue('manage_stock', Boolean(initialProduct.manage_stock))
      setValue('backorders', initialProduct.backorders || 'no')
      setValue('low_stock_amount', initialProduct.low_stock_amount || '')
      setValue('sold_individually', Boolean(initialProduct.sold_individually))
      setValue('weight', initialProduct.weight || '')
      setValue('length', initialProduct.dimensions?.length || '')
      setValue('width', initialProduct.dimensions?.width || '')
      setValue('height', initialProduct.dimensions?.height || '')
      setValue('shipping_class', initialProduct.shipping_class || '')

      // Advanced fields removed from UI

      try {
        const imgs = Array.isArray(initialProduct.images)
          ? (initialProduct.images as ProductImage[])
          : typeof initialProduct.images === 'string'
            ? JSON.parse(initialProduct.images)
            : []

        const normalized: UploadedMedia[] = imgs
          .map((it: ProductImage) => ({
            id: Number(it.id) || 0,
            url: it.src || it.url || '',
            filename: it.name || undefined
          }))
          .filter((x: UploadedMedia) => x.url)

        setMedia(normalized)
      } catch (e) {
        // Silently ignore parsing errors
      }

      try {
        const cats = Array.isArray(initialProduct.categories)
          ? (initialProduct.categories as ProductCategory[])
          : typeof initialProduct.categories === 'string'
            ? JSON.parse(initialProduct.categories as string)
            : []

        setSelectedCategoryIds(cats.map((c: ProductCategory) => Number(c.id)).filter((n: number) => !isNaN(n)))
      } catch (e) {
        // Silently ignore parsing errors
      }
    }
  }, [initialProduct, setValue])

  useEffect(() => {
    const loadTaxonomy = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch('/api/woocommerce/categories', { cache: 'no-store' }),
          fetch('/api/woocommerce/tags', { cache: 'no-store' })
        ])

        const catJson = await catRes.json()
        const tagJson = await tagRes.json()

        if (catRes.ok && catJson?.categories) setCategories(catJson.categories)
        if (tagRes.ok && tagJson?.tags) setTags(tagJson.tags)
      } catch (e) {
        // Silently ignore parsing errors
      }
    }

    loadTaxonomy()
  }, [])

  // Load Woo Attributes list
  useEffect(() => {
    const loadAttributes = async () => {
      try {
        const res = await fetch('/api/woocommerce/attributes', { cache: 'no-store' })
        const json = await res.json()

        if (res.ok && json?.success) setWooAttributes(Array.isArray(json.attributes) ? json.attributes : [])
      } catch (e) {
        // Silently ignore parsing errors
      }
    }

    loadAttributes()
  }, [])

  const ensureTermsLoaded = async (attrId: number) => {
    if (!attrId || termsByAttr[attrId]) return

    try {
      const res = await fetch(`/api/woocommerce/attributes/${attrId}/terms`, { cache: 'no-store' })
      const json = await res.json()

      if (res.ok && json?.success)
        setTermsByAttr(prev => ({ ...prev, [attrId]: Array.isArray(json.terms) ? json.terms : [] }))
    } catch {}
  }

  // Build attribute defs for variation generation (groups duplicate attributes)
  const getVariationAttributeDefs = () => {
    const grouped = new Map<number, { id: number; name: string; termIds: Set<number> }>()

    selectedAttrs
      .filter(a => a.variation && a.attrId && (a.termIds?.length || 0) > 0)
      .forEach(a => {
        const attrId = Number(a.attrId)
        const attrMeta = wooAttributes.find(x => x.id === attrId)

        if (!attrMeta) return
        if (!grouped.has(attrId)) grouped.set(attrId, { id: attrId, name: attrMeta.name, termIds: new Set() })
        const entry = grouped.get(attrId)!

        a.termIds.forEach(tid => entry.termIds.add(tid))
      })

    const defs: Array<{ id: number; name: string; terms: Array<{ id: number; name: string }> }> = []

    grouped.forEach(({ id, name, termIds }) => {
      const terms = (termsByAttr[id] || []).filter(t => termIds.has(t.id)).map(t => ({ id: t.id, name: t.name }))

      if (terms.length) defs.push({ id, name, terms })
    })

    return defs
  }

  // Generate variation combinations from selected attributes
  const generateVariations = () => {
    const defs = getVariationAttributeDefs()

    if (!defs.length) {
      toast.error('Select at least one attribute with terms and mark it as "Used for variations"')

      return
    }

    let acc: Array<Array<{ id: number; name: string; option: string }>> = defs[0].terms.map(t => [
      { id: defs[0].id, name: defs[0].name, option: t.name }
    ])

    for (let i = 1; i < defs.length; i++) {
      const next: Array<Array<{ id: number; name: string; option: string }>> = []

      for (const partial of acc) {
        for (const t of defs[i].terms) next.push([...partial, { id: defs[i].id, name: defs[i].name, option: t.name }])
      }

      acc = next
    }

    const oldMap = new Map(variations.map(v => [v.key, v]))

    const newVars = acc.map(attrs => {
      const key = attrs.map(a => `${a.id}:${a.option}`).join('|')
      const prev = oldMap.get(key)

      return (
        prev || {
          key,
          attributes: attrs,
          stock_status: 'instock',
          manage_stock: false
        }
      )
    })

    setVariations(newVars)
    toast.success(`Generated ${newVars.length} variations`)
  }

  // Load existing variations when product is available
  useEffect(() => {
    const wooId = (initialProduct as any)?.wooId

    if (!wooId || Number.isNaN(Number(wooId))) return

    const load = async () => {
      try {
        const res = await fetch(`/api/products/${wooId}/variations`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))

        if (!res.ok || !json?.success || !Array.isArray(json.variations)) return

        const mapped = json.variations.map((v: any) => {
          const attrs = Array.isArray(v.attributes)
            ? v.attributes
                .filter((a: any) => a && (a.id || a.name) && a.option)
                .map((a: any) => ({ id: Number(a.id) || 0, name: a.name, option: String(a.option) }))
            : []

          const key = attrs.map((a: any) => `${a.id}:${a.option}`).join('|')

          return {
            id: Number(v.id) || undefined,
            key,
            attributes: attrs,
            sku: v.sku || '',
            regular_price: v.regular_price || '',
            sale_price: v.sale_price || '',
            manage_stock: typeof v.manage_stock === 'boolean' ? v.manage_stock : true,
            stock_quantity: typeof v.stock_quantity === 'number' ? v.stock_quantity : Number(v.stock_quantity) || 0,
            stock_status: (v.stock_status || 'instock') as 'instock' | 'outofstock' | 'onbackorder'
          }
        })

        setVariations(mapped)
      } catch {}
    }

    load()
  }, [initialProduct])

  const onSearchProducts = useMemo(
    () =>
      async (query: string): Promise<Array<{ id: string; wooId: number | null; name: string; sku: string | null }>> => {
        if (!query || query.length < 2) return []
        const res = await fetch(`/api/products/search?query=${encodeURIComponent(query)}`)
        const data = await res.json().catch(() => ({}))

        if (res.ok && data?.products) return data.products

        return []
      },
    []
  )

  const onSubmit: SubmitHandler<ProductFormData> = async data => {
    setIsLoading(true)
    setError('')

    try {
      if (!initialProduct) {
        throw new Error('No product data available')
      }

      // Use WooCommerce ID if available, otherwise fall back to internal ID
      const effectiveProductId = (initialProduct as any).wooId || initialProduct.id

      if (!effectiveProductId) {
        throw new Error('No valid product ID found for the update')
      }

      console.log('Using product ID for update:', effectiveProductId)

      // Parse categories if they exist and are a string
      let categories = []

      if (initialProduct.categories) {
        if (typeof initialProduct.categories === 'string') {
          try {
            categories = JSON.parse(initialProduct.categories)
          } catch (e) {
            console.warn('Failed to parse categories:', e)
            categories = []
          }
        } else if (Array.isArray(initialProduct.categories)) {
          categories = initialProduct.categories
        }
      }

      // Prepare the updated product data for WooCommerce
      const updatedProduct: Record<string, unknown> = {
        name: data.name.trim(),
        sku: data.sku.trim(),

        // Ensure regular_price is always set and formatted as a string
        regular_price: data.regular_price ? String(data.regular_price) : '0',

        // Only include sale_price if it has a value and is greater than 0
        sale_price: data.sale_price && parseFloat(String(data.sale_price)) > 0 ? String(data.sale_price) : '',

        // Set the main price to regular_price
        price: data.regular_price ? String(data.regular_price) : '0',
        stock_quantity: parseInt(String(data.stock_quantity || '0')),
        stock_status: data.stock_status || 'instock',
        status: initialProduct.status || 'publish',
        type: variations.length > 0 ? 'variable' : initialProduct.type || 'simple'
      }

      console.log('📊 Preparing product update:', JSON.stringify(updatedProduct, null, 2))

      // Only include categories if we have them
      if (categories && categories.length > 0) {
        updatedProduct.categories = categories
      }

      // Map optional fields only if provided
      // General
      if (typeof data.description === 'string') updatedProduct.description = data.description
      if (typeof data.short_description === 'string') updatedProduct.short_description = data.short_description
      if (data.status) updatedProduct.status = data.status
      if (data.catalog_visibility) updatedProduct.catalog_visibility = data.catalog_visibility

      // Pricing dates (Woo expects ISO8601 or empty)
      if (data.date_on_sale_from) updatedProduct.date_on_sale_from = data.date_on_sale_from
      if (data.date_on_sale_to) updatedProduct.date_on_sale_to = data.date_on_sale_to

      // Inventory
      if (typeof data.manage_stock === 'boolean') updatedProduct.manage_stock = data.manage_stock
      if (data.backorders) updatedProduct.backorders = data.backorders

      if (data.low_stock_amount !== undefined && data.low_stock_amount !== '') {
        updatedProduct.low_stock_amount = Number(data.low_stock_amount)
      }

      if (typeof data.sold_individually === 'boolean') updatedProduct.sold_individually = data.sold_individually

      // Shipping
      const weightNum = data.weight !== undefined && data.weight !== '' ? String(data.weight) : undefined

      if (weightNum !== undefined) updatedProduct.weight = weightNum
      const dims: Record<string, string> = {}

      if (data.length !== undefined && data.length !== '') dims.length = String(data.length)
      if (data.width !== undefined && data.width !== '') dims.width = String(data.width)
      if (data.height !== undefined && data.height !== '') dims.height = String(data.height)
      if (Object.keys(dims).length) updatedProduct.dimensions = dims
      if (data.shipping_class) updatedProduct.shipping_class = data.shipping_class

      // Media: images by IDs or URLs
      const parseCsvToIds = (csv?: string) =>
        (csv || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .map(s => Number(s))
          .filter(n => !isNaN(n))

      // Legacy image IDs/URLs removed; rely on MediaUploader state `media`

      if (media && media.length) {
        updatedProduct.images = media.map(m => (m.id ? { id: m.id } : { src: m.url }))
      }

      // Taxonomy: categories/tags by IDs
      const categoryIds = parseCsvToIds(data.categories_csv)

      if (categoryIds.length) {
        updatedProduct.categories = categoryIds.map(id => ({ id }))
      }

      if (selectedCategoryIds.length) {
        updatedProduct.categories = selectedCategoryIds.map(id => ({ id }))
      }

      const tagIds = parseCsvToIds(data.tags_csv)

      if (tagIds.length) {
        updatedProduct.tags = tagIds.map(id => ({ id }))
      }

      if (selectedTagIds.length) {
        updatedProduct.tags = selectedTagIds.map(id => ({ id }))
      }

      // Attributes
      const attributesPayload = selectedAttrs
        .filter(a => a.attrId && (a.termIds?.length || 0) > 0)
        .map((a, idx) => {
          const attrId = Number(a.attrId)

          const names = (termsByAttr[attrId] || []).filter(t => a.termIds.includes(t.id)).map(t => t.name)

          return {
            id: attrId,
            position: idx,
            visible: a.visible,
            variation: a.variation,
            options: names
          }
        })

      if (attributesPayload.length) updatedProduct.attributes = attributesPayload

      const upsellIds = (selectedUpsells || [])
        .map(p => (p.wooId ? Number(p.wooId) : null))
        .filter((n): n is number => !!n)

      if (upsellIds.length) updatedProduct.upsell_ids = upsellIds

      const crossSellIds = (selectedCrossSells || [])
        .map(p => (p.wooId ? Number(p.wooId) : null))
        .filter((n): n is number => !!n)

      if (crossSellIds.length) updatedProduct.cross_sell_ids = crossSellIds

      // Advanced section removed

      console.log('Sending update request with data:', updatedProduct)

      // Call the API endpoint to update the product
      let response

      try {
        response = await fetch(`/api/products/${effectiveProductId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedProduct, (key, value) => {
            // Filter out undefined values to avoid "Converting undefined to null" errors
            return value === undefined ? undefined : value
          })
        })
      } catch (networkError) {
        console.error('Network error when updating product:', networkError)
        throw new Error(
          'Network error: Could not connect to the server. Please check your internet connection and try again.'
        )
      }

      if (!response.ok) {
        let errorMessage = 'Failed to update product'
        let errorDetails: unknown = null

        try {
          // Get the response text first to handle non-JSON responses
          const responseText = await response.text()

          console.log('Raw error response:', responseText)

          // Try to parse as JSON, but handle cases where it's not valid JSON
          try {
            errorDetails = responseText ? JSON.parse(responseText) : {}
            console.error('Error response from server (JSON):', errorDetails)
          } catch (jsonError) {
            console.error('Error response from server (raw text):', responseText)
            errorDetails = { message: responseText || 'No error details provided' }
          }

          // Build a more detailed error message from various possible error formats
          if (errorDetails) {
            console.log('Full error details:', JSON.stringify(errorDetails, null, 2))

            // Handle Axios error format
            if ((errorDetails as any).isAxiosError) {
              errorMessage = (errorDetails as any).message || 'An error occurred while connecting to the server'

              // Try to extract more details from the response
              if ((errorDetails as any).data) {
                const { data } = errorDetails as any

                // WooCommerce REST API error format
                if (data.code && data.message) {
                  errorMessage = `[${data.code}] ${data.message}`

                  // Add more specific error messages for common WooCommerce errors
                  if (data.code === 'woocommerce_rest_product_invalid_id') {
                    errorMessage = 'Invalid product ID. The product may have been deleted.'
                  } else if (data.code === 'woocommerce_rest_cannot_edit') {
                    errorMessage = 'You do not have permission to edit this product.'
                  } else if (data.code === 'woocommerce_rest_product_invalid_stock_quantity') {
                    errorMessage = 'Invalid stock quantity. Please enter a valid number.'
                  }
                }

                // Handle validation errors
                else if (data.errors) {
                  const errorMessages = Object.values(data.errors).flat()

                  errorMessage = `Validation error: ${errorMessages.join(', ')}`
                }

                // Handle other error formats
                else if (data.error) {
                  errorMessage = data.error
                }
              }
            }

            // WooCommerce API error format
            else if ((errorDetails as any).code && (errorDetails as any).message) {
              errorMessage = `[${(errorDetails as any).code}] ${(errorDetails as any).message}`

              // Add more specific error messages for common WooCommerce errors
              if ((errorDetails as any).code === 'woocommerce_rest_product_invalid_id') {
                errorMessage = 'Invalid product ID. The product may have been deleted.'
              } else if ((errorDetails as any).code === 'woocommerce_rest_cannot_edit') {
                errorMessage = 'You do not have permission to edit this product.'
              } else if ((errorDetails as any).code === 'woocommerce_rest_product_invalid_stock_quantity') {
                errorMessage = 'Invalid stock quantity. Please enter a valid number.'
              }
            }

            // Nested details object
            else if ((errorDetails as any).details) {
              if (typeof (errorDetails as any).details === 'string') {
                errorMessage = (errorDetails as any).details
              } else if ((errorDetails as any).details.message) {
                errorMessage = (errorDetails as any).details.message

                if ((errorDetails as any).details.code) {
                  errorMessage = `[${(errorDetails as any).details.code}] ${errorMessage}`
                }
              }
            }

            // Direct message
            else if ((errorDetails as any).message) {
              errorMessage = (errorDetails as any).message
            }

            // Handle validation errors in data.errors
            else if ((errorDetails as any).errors) {
              const errorMessages = Object.values((errorDetails as any).errors).flat()

              errorMessage = `Validation error: ${errorMessages.join(', ')}`
            }

            // Fallback to stringify the entire error object
            else if (Object.keys(errorDetails).length > 0) {
              errorMessage = `Error: ${JSON.stringify(errorDetails)}`
            }
          }

          // Include status code if available
          if (response.status) {
            // Map common HTTP status codes to user-friendly messages
            const statusMessages: Record<number, string> = {
              400: 'Bad Request - The request was invalid or cannot be served',
              401: 'Unauthorized - Please log in again',
              403: 'Forbidden - You do not have permission to perform this action',
              404: 'Product not found',
              409: 'Conflict - The product was modified by another user',
              422: 'Validation Error - Please check your input',
              429: 'Too many requests - Please try again later',
              500: 'Server Error - Please try again later',
              502: 'Bad Gateway - The server is temporarily unavailable',
              503: 'Service Unavailable - The server is currently unable to handle the request',
              504: 'Gateway Timeout - The server took too long to respond'
            }

            const statusMessage = statusMessages[response.status] || `HTTP ${response.status}`

            errorMessage = `[${statusMessage}] ${errorMessage}`
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`
        }

        // Log the full error for debugging
        console.error('Product update failed:', {
          status: response.status,
          statusText: response.statusText,
          errorDetails,
          productData: updatedProduct
        })

        throw new Error(errorMessage)
      }

      const result = await response.json()

      console.log('Product update successful:', result)

      toast.success('Product updated successfully!')

      // Upsert variations after product update
      try {
        const effectiveProductId = (initialProduct as any).wooId || initialProduct.id
        const wooIdNum = Number(effectiveProductId)

        if (variations.length && !Number.isNaN(wooIdNum)) {
          const upRes = await fetch(`/api/products/${wooIdNum}/variations`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              variations: variations.map(v => ({
                id: v.id,
                sku: v.sku,
                regular_price: v.regular_price,
                sale_price: v.sale_price,
                manage_stock: v.manage_stock,
                stock_quantity: v.stock_quantity,
                stock_status: v.stock_status,
                attributes: v.attributes
              }))
            })
          })

          if (!upRes.ok) {
            const txt = await upRes.text()

            console.error('Failed to upsert variations:', txt)
            toast.error('Variations update failed')
          } else {
            toast.success('Variations updated')
          }
        }
      } catch (ve) {
        console.error('Error updating variations:', ve)
        toast.error('Could not update variations')
      }

      // Add a small delay before redirecting to ensure the toast is visible
      setTimeout(() => {
        router.push(`/${lang}/apps/ecommerce/products/list`)
      }, 1000)
    } catch (err) {
      console.error('Error updating product:', {
        name: (err as Error).name,
        message: (err as Error).message,
        stack: (err as any).stack,
        ...((err as any).response
          ? {
              status: (err as any).response.status,
              statusText: (err as any).response.statusText,
              data: (err as any).response.data,
              headers: (err as any).response.headers,
              config: {
                url: (err as any).response.config?.url,
                method: (err as any).response.config?.method,
                data: (err as any).response.config?.data
              }
            }
          : {})
      })

      // Extract error message from different possible locations
      let errorMessage = 'Failed to update product'

      if ((err as any).response?.data?.message) {
        errorMessage = (err as any).response.data.message
      } else if ((err as any).response?.data?.error) {
        errorMessage = (err as any).response.data.error
      } else if ((err as Error).message) {
        errorMessage = (err as Error).message
      }

      setError(errorMessage)

      // Show a more detailed error toast
      toast.error(errorMessage, {
        duration: 5000, // Show for 5 seconds
        position: 'top-right',
        style: {
          maxWidth: '500px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!initialProduct) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <Typography variant='h6'>Product not found</Typography>
      </Box>
    )
  }

  return (
    <Paper sx={{ p: 5 }}>
      <ProductAddHeader isEdit={true} product={initialProduct} />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 360px' },
            alignItems: 'start',
            gap: 3
          }}
        >
          <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='h6' gutterBottom>
                Product Information
              </Typography>

              <TextField
                label='Product Name'
                fullWidth
                margin='normal'
                {...register('name', {
                  required: 'Product name is required',
                  minLength: { value: 3, message: 'Name must be at least 3 characters' }
                })}
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={isLoading}
              />

              <TextField
                label='SKU'
                fullWidth
                margin='normal'
                {...register('sku', {
                  maxLength: { value: 50, message: 'SKU must be less than 50 characters' }
                })}
                error={!!errors.sku}
                helperText={errors.sku?.message}
                disabled={isLoading}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label='Regular Price'
                    fullWidth
                    margin='normal'
                    type='number'
                    inputProps={{
                      min: 0,
                      step: '0.01'
                    }}
                    {...register('regular_price', {
                      min: { value: 0, message: 'Price cannot be negative' },
                      validate: value => {
                        if (value === '') return true
                        const num = typeof value === 'string' ? parseFloat(value) : value

                        return !isNaN(num) || 'Must be a valid number'
                      }
                    })}
                    error={!!errors.regular_price}
                    helperText={errors.regular_price?.message}
                    disabled={isLoading}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label='Sale Price'
                    fullWidth
                    margin='normal'
                    type='number'
                    inputProps={{
                      min: 0,
                      step: '0.01'
                    }}
                    {...register('sale_price', {
                      min: { value: 0, message: 'Price cannot be negative' },
                      validate: value => {
                        if (value === '') return true
                        const num = typeof value === 'string' ? parseFloat(value) : value

                        return !isNaN(num) || 'Must be a valid number'
                      }
                    })}
                    error={!!errors.sale_price}
                    helperText={errors.sale_price?.message}
                    disabled={isLoading}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth margin='normal' disabled={isLoading}>
                    <InputLabel>Stock Status</InputLabel>
                    <Select
                      label='Stock Status'
                      defaultValue='instock'
                      {...register('stock_status')}
                      error={!!errors.stock_status}
                    >
                      <MenuItem value='instock'>In Stock</MenuItem>
                      <MenuItem value='outofstock'>Out of Stock</MenuItem>
                      <MenuItem value='onbackorder'>On Backorder</MenuItem>
                    </Select>
                    {errors.stock_status && (
                      <FormHelperText error={!!errors.stock_status}>{errors.stock_status.message}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label='Stock Quantity'
                    fullWidth
                    margin='normal'
                    type='number'
                    inputProps={{ min: 0 }}
                    {...register('stock_quantity', {
                      min: { value: 0, message: 'Quantity cannot be negative' },
                      validate: value => {
                        if (value === '') return true
                        const num = typeof value === 'string' ? parseInt(value) : value

                        return (!isNaN(num) && num >= 0) || 'Must be a valid number'
                      }
                    })}
                    error={!!errors.stock_quantity}
                    helperText={errors.stock_quantity?.message}
                    disabled={isLoading}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='h6' gutterBottom>
                Attributes
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selectedAttrs.map((row, i) => {
                  const selectedAttr = wooAttributes.find(a => a.id === row.attrId)
                  const terms = row.attrId ? termsByAttr[row.attrId] || [] : []

                  return (
                    <Box
                      key={i}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                        gap: 2,
                        alignItems: 'center'
                      }}
                    >
                      <Autocomplete
                        options={wooAttributes}
                        getOptionLabel={o => o.name}
                        value={selectedAttr || null}
                        onChange={async (_, val) => {
                          const newArr = [...selectedAttrs]

                          newArr[i] = { ...newArr[i], attrId: val ? val.id : null, termIds: [] }
                          setSelectedAttrs(newArr)
                          if (val?.id) await ensureTermsLoaded(val.id)
                        }}
                        renderInput={params => (
                          <TextField {...params} label='Attribute' placeholder='Select attribute' />
                        )}
                      />
                      <Autocomplete
                        multiple
                        options={terms}
                        getOptionLabel={o => o.name}
                        value={terms.filter(t => row.termIds.includes(t.id))}
                        onChange={(_, vals) => {
                          const newArr = [...selectedAttrs]

                          newArr[i] = { ...newArr[i], termIds: vals.map(v => v.id) }
                          setSelectedAttrs(newArr)
                        }}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip {...getTagProps({ index })} key={option.id} label={option.name} />
                          ))
                        }
                        renderInput={params => <TextField {...params} label='Terms' placeholder='Select terms' />}
                        disabled={!row.attrId}
                      />
                      <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 2 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={row.visible}
                              onChange={e => {
                                const a = [...selectedAttrs]

                                a[i] = { ...a[i], visible: e.target.checked }
                                setSelectedAttrs(a)
                              }}
                            />
                          }
                          label='Visible on product page'
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={row.variation}
                              onChange={e => {
                                const a = [...selectedAttrs]

                                a[i] = { ...a[i], variation: e.target.checked }
                                setSelectedAttrs(a)
                              }}
                            />
                          }
                          label='Used for variations'
                        />
                        <Button
                          size='small'
                          color='secondary'
                          onClick={() => setSelectedAttrs(prev => prev.filter((_, idx) => idx !== i))}
                          disabled={selectedAttrs.length === 1}
                        >
                          Remove
                        </Button>
                      </Box>
                    </Box>
                  )
                })}
                <Box>
                  <Button
                    size='small'
                    variant='outlined'
                    startIcon={<i className='tabler-plus' />}
                    onClick={() =>
                      setSelectedAttrs(prev => [
                        ...prev,
                        { attrId: null, termIds: [], visible: true, variation: false }
                      ])
                    }
                  >
                    Add Attribute
                  </Button>
                </Box>
              </Box>
            </Paper>

            {/* Variations */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant='h6'>Variations</Typography>
                <Button
                  size='small'
                  variant='outlined'
                  startIcon={<i className='tabler-wand' />}
                  onClick={generateVariations}
                >
                  Generate Variations
                </Button>
              </Box>
              {variations.length === 0 ? (
                <Typography variant='body2' color='text.secondary'>
                  No variations loaded/generated.
                </Typography>
              ) : (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  {variations.map((v, idx) => (
                    <Box
                      key={v.key || v.id || idx}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '2fr repeat(5, 1fr)' },
                        gap: 2,
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant='body2'>
                        {v.attributes.map(a => `${a.name}: ${a.option}`).join(' • ')}
                      </Typography>
                      <TextField
                        label='SKU'
                        size='small'
                        value={v.sku || ''}
                        onChange={e => {
                          const arr = [...variations]

                          arr[idx] = { ...v, sku: e.target.value }
                          setVariations(arr)
                        }}
                      />
                      <TextField
                        label='Regular Price'
                        size='small'
                        type='number'
                        inputProps={{ min: 0, step: '0.01' }}
                        value={v.regular_price || ''}
                        onChange={e => {
                          const arr = [...variations]

                          arr[idx] = { ...v, regular_price: e.target.value }
                          setVariations(arr)
                        }}
                      />
                      <TextField
                        label='Sale Price'
                        size='small'
                        type='number'
                        inputProps={{ min: 0, step: '0.01' }}
                        value={v.sale_price || ''}
                        onChange={e => {
                          const arr = [...variations]

                          arr[idx] = { ...v, sale_price: e.target.value }
                          setVariations(arr)
                        }}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!v.manage_stock}
                            onChange={e => {
                              const arr = [...variations]

                              arr[idx] = { ...v, manage_stock: e.target.checked }
                              setVariations(arr)
                            }}
                          />
                        }
                        label='Manage Stock'
                      />
                      <TextField
                        label='Quantity'
                        size='small'
                        type='number'
                        inputProps={{ min: 0 }}
                        value={v.stock_quantity ?? 0}
                        onChange={e => {
                          const arr = [...variations]

                          arr[idx] = { ...v, stock_quantity: Number(e.target.value) || 0 }
                          setVariations(arr)
                        }}
                      />
                      <FormControl size='small'>
                        <InputLabel>Stock Status</InputLabel>
                        <Select
                          label='Stock Status'
                          value={v.stock_status || 'instock'}
                          onChange={e => {
                            const arr = [...variations]

                            arr[idx] = { ...v, stock_status: e.target.value as any }
                            setVariations(arr)
                          }}
                        >
                          <MenuItem value='instock'>In Stock</MenuItem>
                          <MenuItem value='outofstock'>Out of Stock</MenuItem>
                          <MenuItem value='onbackorder'>On Backorder</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>

            <MediaUploader value={media} onChange={setMedia} />

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='h6' gutterBottom>
                General
              </Typography>

              <TextField
                label='Short Description'
                fullWidth
                margin='normal'
                multiline
                minRows={2}
                {...register('short_description')}
                disabled={isLoading}
              />

              <TextField
                label='Description'
                fullWidth
                margin='normal'
                multiline
                minRows={4}
                {...register('description')}
                disabled={isLoading}
              />

              <FormControl fullWidth margin='normal' disabled={isLoading}>
                <InputLabel>Catalog Visibility</InputLabel>
                <Select label='Catalog Visibility' defaultValue={'visible'} {...register('catalog_visibility')}>
                  <MenuItem value='visible'>Visible</MenuItem>
                  <MenuItem value='catalog'>Catalog</MenuItem>
                  <MenuItem value='search'>Search</MenuItem>
                  <MenuItem value='hidden'>Hidden</MenuItem>
                </Select>
              </FormControl>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='h6' gutterBottom>
                Pricing
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label='Sale Start (YYYY-MM-DD)'
                    fullWidth
                    margin='normal'
                    placeholder='2025-01-01'
                    {...register('date_on_sale_from')}
                    disabled={isLoading}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label='Sale End (YYYY-MM-DD)'
                    fullWidth
                    margin='normal'
                    placeholder='2025-01-31'
                    {...register('date_on_sale_to')}
                    disabled={isLoading}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Inventory moved to right column */}

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='h6' gutterBottom>
                Shipping
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField label='Weight' fullWidth margin='normal' {...register('weight')} disabled={isLoading} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField label='Length' fullWidth margin='normal' {...register('length')} disabled={isLoading} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField label='Width' fullWidth margin='normal' {...register('width')} disabled={isLoading} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField label='Height' fullWidth margin='normal' {...register('height')} disabled={isLoading} />
                </Grid>
              </Grid>
              <TextField
                label='Shipping Class'
                fullWidth
                margin='normal'
                {...register('shipping_class')}
                disabled={isLoading}
              />
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='h6' gutterBottom>
                Categories & Tags
              </Typography>
              <Box
                sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, alignItems: 'start' }}
              >
                <Box sx={{ width: '100%', minWidth: 0 }}>
                  <Autocomplete
                    size='small'
                    multiple
                    options={categories}
                    getOptionLabel={o => o.name}
                    value={categories.filter(c => selectedCategoryIds.includes(c.id))}
                    onChange={(_, val) => setSelectedCategoryIds(val.map(v => v.id))}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip {...getTagProps({ index })} key={option.id} label={option.name} />
                      ))
                    }
                    renderInput={params => (
                      <TextField
                        {...params}
                        fullWidth
                        label='Categories'
                        placeholder='Search categories'
                        size='small'
                      />
                    )}
                    sx={{ width: '100%' }}
                  />
                </Box>
                <Box sx={{ width: '100%', minWidth: 0 }}>
                  <Autocomplete
                    size='small'
                    multiple
                    options={tags}
                    getOptionLabel={o => o.name}
                    value={tags.filter(t => selectedTagIds.includes(t.id))}
                    onChange={(_, val) => setSelectedTagIds(val.map(v => v.id))}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip {...getTagProps({ index })} key={option.id} label={option.name} />
                      ))
                    }
                    renderInput={params => (
                      <TextField {...params} fullWidth label='Tags' placeholder='Search tags' size='small' />
                    )}
                    sx={{ width: '100%' }}
                  />
                </Box>
              </Box>
            </Paper>
          </Box>

          <Box>
            <Paper sx={{ p: 3, mb: 3, position: 'sticky', top: 16 }}>
              <Button
                type='submit'
                variant='contained'
                color='primary'
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                sx={{ mb: 2 }}
              >
                {isLoading ? 'Saving...' : 'Update Product'}
              </Button>

              <Autocomplete
                multiple
                filterSelectedOptions
                options={upsellOptions}
                getOptionLabel={o => `${o.name}${o.sku ? ` (${o.sku})` : ''}`}
                value={selectedUpsells}
                onChange={(_, val) => setSelectedUpsells(val)}
                onInputChange={async (_, input) => {
                  const results = await onSearchProducts(input)

                  setUpsellOptions(results)
                }}
                renderInput={params => (
                  <TextField {...params} label='Upsells' placeholder='Search products' margin='normal' />
                )}
              />

              <Autocomplete
                multiple
                filterSelectedOptions
                options={crossSellOptions}
                getOptionLabel={o => `${o.name}${o.sku ? ` (${o.sku})` : ''}`}
                value={selectedCrossSells}
                onChange={(_, val) => setSelectedCrossSells(val)}
                onInputChange={async (_, input) => {
                  const results = await onSearchProducts(input)

                  setCrossSellOptions(results)
                }}
                renderInput={params => (
                  <TextField {...params} label='Cross-sells' placeholder='Search products' margin='normal' />
                )}
              />

              <Button
                variant='outlined'
                color='secondary'
                onClick={() => router.push(`/${lang}/apps/ecommerce/products/list`)}
                disabled={isLoading}
                sx={{ ml: 2 }}
              >
                Cancel
              </Button>

              {error && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                  <Typography variant='body2' color='error.contrastText'>
                    {error}
                  </Typography>
                </Box>
              )}
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='h6' gutterBottom>
                Inventory
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Backorders</InputLabel>
                    <Select label='Backorders' defaultValue={'no'} {...register('backorders')} disabled={isLoading}>
                      <MenuItem value='no'>Do not allow</MenuItem>
                      <MenuItem value='notify'>Allow, but notify customer</MenuItem>
                      <MenuItem value='yes'>Allow</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label='Low stock threshold'
                    fullWidth
                    margin='normal'
                    type='number'
                    inputProps={{ min: 0 }}
                    {...register('low_stock_amount')}
                    disabled={isLoading}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth margin='normal'>
                    <InputLabel>Manage Stock</InputLabel>
                    <Select
                      label='Manage Stock'
                      defaultValue={false as any}
                      {...register('manage_stock')}
                      disabled={isLoading}
                    >
                      <MenuItem value='true'>Yes</MenuItem>
                      <MenuItem value='false'>No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <FormControl fullWidth margin='normal'>
                <InputLabel>Sold Individually</InputLabel>
                <Select
                  label='Sold Individually'
                  defaultValue={false as any}
                  {...register('sold_individually')}
                  disabled={isLoading}
                >
                  <MenuItem value='true'>Yes</MenuItem>
                  <MenuItem value='false'>No</MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Box>
        </Box>
      </form>
    </Paper>
  )
}
