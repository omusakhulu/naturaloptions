'use client'

import { useState, useEffect, useMemo, useRef } from 'react'

import { useParams, useRouter } from 'next/navigation'

import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import {
  Box,
  Button,
  CircularProgress,
  Chip,
  Divider,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
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

// Local buying price utilities
import { getBuyingPriceBySku, setBuyingPriceBySku } from '@/utils/buyingPriceUtils'

// Save product is now handled via API route

type StockStatus = 'instock' | 'outofstock' | 'onbackorder'

type VariationData = {
  id?: number
  key: string
  attributes: Array<{ id: number; name: string; option: string }>
  sku?: string
  regular_price?: string
  sale_price?: string
  manage_stock?: boolean
  stock_quantity?: number
  stock_status?: StockStatus
}

interface ProductFormData {
  name: string
  sku: string
  price: string | number
  regular_price: string | number
  sale_price: string | number
  buying_price?: string | number
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
  const [isSearchingProducts, setIsSearchingProducts] = useState<boolean>(false)
  const [isSearchingSkus, setIsSearchingSkus] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [media, setMedia] = useState<UploadedMedia[]>([])
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'variations' | 'marketing'>('general')
  const [submitIntent, setSubmitIntent] = useState<'update' | 'draft' | 'publish'>('update')
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
  const [tags, setTags] = useState<Array<{ id: number; name: string }>>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [buyingPrice, setBuyingPrice] = useState<string>('')

  const [skuOptions, setSkuOptions] = useState<string[]>([])

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
  const [variations, setVariations] = useState<VariationData[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useForm<ProductFormData>()

  const hasVariationAttributes = useMemo(() => selectedAttrs.some(a => a.variation), [selectedAttrs])

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

      // Load buying price from local storage
      if (initialProduct.sku) {
        const storedBuyingPrice = getBuyingPriceBySku(initialProduct.sku)
        setBuyingPrice(storedBuyingPrice ? storedBuyingPrice.toString() : '')
        setValue('buying_price', storedBuyingPrice ? storedBuyingPrice.toString() : '')
      }

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

  // Handle buying price change
  const handleBuyingPriceChange = (value: string) => {
    setBuyingPrice(value)
    // Save to local storage when SKU exists
    const currentSku = initialProduct?.sku || watch('sku') || ''
    if (currentSku && value && !isNaN(parseFloat(value))) {
      setBuyingPriceBySku(currentSku, parseFloat(value))
    }

    // Margin validation depends on buying price
    trigger('regular_price')
  }

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchTokenRef = useRef(0)

  const onSearchProducts = useMemo(
    () =>
      async (query: string): Promise<Array<{ id: string; wooId: number | null; name: string; sku: string | null }>> => {
        if (!query || query.length < 2) return []

        const res = await fetch(`/api/products/search?query=${encodeURIComponent(query)}`)
        const data = await res.json().catch(() => ({}))

        if (res.ok && Array.isArray(data?.products)) return data.products

        return []
      },
    []
  )

  const onSearchSkus = useMemo(
    () =>
      async (sku: string): Promise<string[]> => {
        if (!sku || sku.length < 2) return []

        const res = await fetch(`/api/products/search?sku=${encodeURIComponent(sku)}`)
        const data = await res.json().catch(() => ({}))

        if (res.ok && Array.isArray(data?.skus)) return data.skus

        return []
      },
    []
  )

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

    const oldMap = new Map<string, VariationData>(variations.map(v => [v.key, v]))

    const newVars: VariationData[] = acc.map(attrs => {
      const key = attrs.map(a => `${a.id}:${a.option}`).join('|')
      const prev = oldMap.get(key)

      return (
        prev ?? {
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
                .filter((a: any) => a && (a.id || a.name) && (a.option !== undefined && a.option !== null))
                .map((a: any) => ({ id: Number(a.id) || 0, name: a.name, option: String(a.option) }))
            : []

          const key = attrs.map((a: any) => `${a.id}:${a.option}`).join('|')

          const normalizedStockStatus: StockStatus =
            v.stock_status === 'instock' || v.stock_status === 'outofstock' || v.stock_status === 'onbackorder'
              ? v.stock_status
              : 'instock'

          const row: VariationData = {
            id: Number(v.id) || undefined,
            key,
            attributes: attrs,
            sku: v.sku || '',
            regular_price: v.regular_price || '',
            sale_price: v.sale_price || '',
            manage_stock: Boolean(v.manage_stock),
            stock_quantity: v.stock_quantity != null ? Number(v.stock_quantity) : 0,
            stock_status: normalizedStockStatus
          }

          return row
        })

        setVariations(mapped)
      } catch {
        // Silently ignore parsing errors
      }
    }

    load()
  }, [initialProduct])

  const onSubmit: SubmitHandler<ProductFormData> = async data => {
    setIsLoading(true)
    setError('')

    try {
      if (!initialProduct) {
        throw new Error('No product data available')
      }

      // Margin protection: do not allow regular price < buying price
      const regularNum = data.regular_price === '' ? NaN : Number(data.regular_price)
      const buyingNum = data.buying_price === '' ? NaN : Number(data.buying_price)
      if (Number.isFinite(regularNum) && Number.isFinite(buyingNum) && regularNum < buyingNum) {
        throw new Error('Regular price cannot be less than buying price')
      }

      // Use WooCommerce ID if available, otherwise fall back to internal ID
      const effectiveProductId = (initialProduct as any).wooId || initialProduct.id

      if (!effectiveProductId) {
        throw new Error('No valid product ID found for the update')
      }

      // Basic numeric validation to avoid "KSh NaN" downstream
      const numericOrError = (label: string, value: unknown) => {
        if (value === undefined || value === null || value === '') return null
        const num = typeof value === 'string' ? Number(value) : Number(value)
        if (!Number.isFinite(num)) throw new Error(`${label} must be a valid number`)
        return num
      }

      numericOrError('Regular Price', data.regular_price)
      numericOrError('Sale Price', data.sale_price)
      numericOrError('Buying Price', data.buying_price)
      numericOrError('Stock Quantity', data.stock_quantity)

      const nextStatus = submitIntent === 'draft' ? 'draft' : submitIntent === 'publish' ? 'publish' : undefined

      const updatedProduct: Record<string, unknown> = {
        name: data.name.trim(),
        sku: data.sku.trim(),
        regular_price: data.regular_price ? String(data.regular_price) : '0',
        sale_price: data.sale_price && parseFloat(String(data.sale_price)) > 0 ? String(data.sale_price) : '',
        price: data.regular_price ? String(data.regular_price) : '0',
        stock_quantity: parseInt(String(data.stock_quantity || '0')),
        stock_status: data.stock_status || 'instock',
        status: nextStatus || initialProduct.status || 'publish',
        type: variations.length > 0 ? 'variable' : initialProduct.type || 'simple'
      }

      if (typeof data.description === 'string') updatedProduct.description = data.description
      if (typeof data.short_description === 'string') updatedProduct.short_description = data.short_description
      if (data.catalog_visibility) updatedProduct.catalog_visibility = data.catalog_visibility

      if (typeof data.manage_stock === 'boolean') updatedProduct.manage_stock = data.manage_stock
      if (data.backorders) updatedProduct.backorders = data.backorders
      if (data.low_stock_amount !== undefined && data.low_stock_amount !== '') updatedProduct.low_stock_amount = Number(data.low_stock_amount)
      if (typeof data.sold_individually === 'boolean') updatedProduct.sold_individually = data.sold_individually

      const weightNum = data.weight !== undefined && data.weight !== '' ? String(data.weight) : undefined
      if (weightNum !== undefined) updatedProduct.weight = weightNum
      const dims: Record<string, string> = {}
      if (data.length !== undefined && data.length !== '') dims.length = String(data.length)
      if (data.width !== undefined && data.width !== '') dims.width = String(data.width)
      if (data.height !== undefined && data.height !== '') dims.height = String(data.height)
      if (Object.keys(dims).length) updatedProduct.dimensions = dims
      if (data.shipping_class) updatedProduct.shipping_class = data.shipping_class

      if (media && media.length) {
        updatedProduct.images = media.map(m => (m.id ? { id: m.id } : { src: m.url }))
      }

      if (selectedCategoryIds.length) updatedProduct.categories = selectedCategoryIds.map(id => ({ id }))
      if (selectedTagIds.length) updatedProduct.tags = selectedTagIds.map(id => ({ id }))

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

      const response = await fetch(`/api/products/${effectiveProductId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedProduct, (key, value) => (value === undefined ? undefined : value))
      })

      if (!response.ok) {
        const txt = await response.text().catch(() => '')
        throw new Error(txt || 'Failed to update product')
      }

      toast.success('Product updated successfully!')

      // Upsert variations after product update
      try {
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

      setTimeout(() => {
        router.push(`/${lang}/apps/ecommerce/products/list`)
      }, 1000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update product'
      setError(msg)
      toast.error(msg)
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
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          bgcolor: 'background.paper',
          pb: 2,
          mb: 3,
          borderBottom: theme => `1px solid ${theme.palette.divider}`
        }}
      >
        <ProductAddHeader isEdit={true} product={initialProduct} />
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2, alignItems: 'center' }}>
          <Button
            variant='outlined'
            color='secondary'
            onClick={() => router.push(`/${lang}/apps/ecommerce/products/list`)}
            disabled={isLoading}
          >
            Discard
          </Button>
          <Button
            variant='outlined'
            onClick={() => {
              setSubmitIntent('draft')
            }}
            type='submit'
            form='product-edit-form'
            disabled={isLoading}
          >
            Save Draft
          </Button>
          <Button
            variant='contained'
            onClick={() => {
              setSubmitIntent('update')
            }}
            type='submit'
            form='product-edit-form'
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {isLoading ? 'Saving...' : 'Update Product'}
          </Button>
          <Button
            variant='outlined'
            onClick={() => {
              setSubmitIntent('publish')
            }}
            type='submit'
            form='product-edit-form'
            disabled={isLoading}
          >
            Publish Product
          </Button>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant='scrollable'
            scrollButtons='auto'
          >
            <Tab value='general' label='General' />
            <Tab value='pricing' label='Pricing / Inventory' />
            <Tab value='variations' label='Variations' />
            <Tab value='marketing' label='Marketing' />
          </Tabs>
        </Box>
      </Box>
      <form id='product-edit-form' onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <Box sx={{ mb: 3 }}>
            <Paper sx={{ p: 2, bgcolor: 'error.light' }}>
              <Typography variant='body2' color='error.contrastText'>
                {error}
              </Typography>
            </Paper>
          </Box>
        )}

        {activeTab === 'general' && (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <MediaUploader value={media} onChange={setMedia} />

            <Paper sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom>
                General Information
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

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 2,
                  alignItems: 'start'
                }}
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
                        placeholder='Type to search'
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
                      <TextField {...params} fullWidth label='Tags' placeholder='Type to search' size='small' />
                    )}
                    sx={{ width: '100%' }}
                  />
                </Box>
              </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom>
                Description
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
          </Box>
        )}

        {activeTab === 'pricing' && (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom>
                Pricing & Stock
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label='Regular Price'
                    fullWidth
                    margin='normal'
                    type='number'
                    inputProps={{ min: 0, step: '0.01' }}
                    {...register('regular_price', {
                      min: { value: 0, message: 'Price cannot be negative' },
                      validate: value => {
                        if (value === '') return true
                        const num = typeof value === 'string' ? parseFloat(value) : value

                        if (isNaN(num)) return 'Must be a valid number'

                        const buyingNum = buyingPrice !== '' ? parseFloat(String(buyingPrice)) : NaN

                        if (!isNaN(buyingNum) && num < buyingNum) {
                          return 'Regular price cannot be less than buying price'
                        }

                        return true
                      }
                    })}
                    error={!!errors.regular_price}
                    helperText={errors.regular_price?.message}
                    disabled={isLoading}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label='Buying Price'
                    fullWidth
                    margin='normal'
                    type='number'
                    value={buyingPrice}
                    inputProps={{ min: 0, step: '0.01' }}
                    {...register('buying_price', {
                      min: { value: 0, message: 'Buying price cannot be negative' },
                      validate: value => {
                        if (value === '' || value === undefined || value === null) return true
                        const num = typeof value === 'string' ? parseFloat(value) : Number(value)

                        return Number.isFinite(num) || 'Must be a valid number'
                      }
                    })}
                    onChange={e => handleBuyingPriceChange(e.target.value)}
                    error={!!errors.buying_price}
                    helperText={errors.buying_price?.message || 'Stored locally for stock calculations'}
                    disabled={isLoading}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label='Sale Price'
                    fullWidth
                    margin='normal'
                    type='number'
                    inputProps={{ min: 0, step: '0.01' }}
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
                    <Select label='Stock Status' defaultValue='instock' {...register('stock_status')} error={!!errors.stock_status}>
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

            <Paper sx={{ p: 3 }}>
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

            <Paper sx={{ p: 3 }}>
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
          </Box>
        )}

        {activeTab === 'variations' && (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Paper sx={{ p: 3 }}>
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

            {hasVariationAttributes ? (
              <Paper sx={{ p: 3 }}>
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
                    Variations will appear after you mark at least one attribute as "Used for variations" and generate.
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
                        <Autocomplete
                          freeSolo
                          options={skuOptions}
                          value={v.sku || ''}
                          onInputChange={(_, input) => {
                            const arr = [...variations]

                            arr[idx] = { ...v, sku: input }
                            setVariations(arr)
                          }}
                          onChange={(_, val) => {
                            const next = typeof val === 'string' ? val : ''
                            const arr = [...variations]

                            arr[idx] = { ...v, sku: next }
                            setVariations(arr)
                          }}
                          onOpen={async () => {
                            const seed = (v.sku || '').trim()
                            if (seed.length < 2) return

                            setIsSearchingSkus(true)
                            try {
                              const results = await onSearchSkus(seed)

                              setSkuOptions(results)
                            } finally {
                              setIsSearchingSkus(false)
                            }
                          }}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label='SKU'
                              size='small'
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {isSearchingSkus ? <CircularProgress color='inherit' size={16} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                )
                              }}
                            />
                          )}
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
            ) : (
              <Paper sx={{ p: 3 }}>
                <Typography variant='body2' color='text.secondary'>
                  Variations are hidden until you check "Used for variations" on at least one Attribute.
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {activeTab === 'marketing' && (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant='h6' gutterBottom>
                Upsells & Cross-sells
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                Start typing (2+ characters) to search products.
              </Typography>

              <Autocomplete
                multiple
                filterSelectedOptions
                options={upsellOptions}
                getOptionLabel={o => `${o.name}${o.sku ? ` (${o.sku})` : ''}`}
                value={selectedUpsells}
                onChange={(_, val) => setSelectedUpsells(val)}
                onInputChange={(_, input) => {
                  if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
                  const token = ++searchTokenRef.current

                  if (!input || input.length < 2) {
                    setUpsellOptions([])
                    setIsSearchingProducts(false)
                    return
                  }

                  setIsSearchingProducts(true)
                  debounceTimeoutRef.current = setTimeout(async () => {
                    try {
                      const results = await onSearchProducts(input)
                      if (token !== searchTokenRef.current) return

                      setUpsellOptions(results)
                    } finally {
                      if (token === searchTokenRef.current) setIsSearchingProducts(false)
                    }
                  }, 300)
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Upsells'
                    placeholder='Search products'
                    margin='normal'
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isSearchingProducts ? <CircularProgress color='inherit' size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />

              <Autocomplete
                multiple
                filterSelectedOptions
                options={crossSellOptions}
                getOptionLabel={o => `${o.name}${o.sku ? ` (${o.sku})` : ''}`}
                value={selectedCrossSells}
                onChange={(_, val) => setSelectedCrossSells(val)}
                onInputChange={(_, input) => {
                  if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
                  const token = ++searchTokenRef.current

                  if (!input || input.length < 2) {
                    setCrossSellOptions([])
                    setIsSearchingProducts(false)
                    return
                  }

                  setIsSearchingProducts(true)
                  debounceTimeoutRef.current = setTimeout(async () => {
                    try {
                      const results = await onSearchProducts(input)
                      if (token !== searchTokenRef.current) return

                      setCrossSellOptions(results)
                    } finally {
                      if (token === searchTokenRef.current) setIsSearchingProducts(false)
                    }
                  }, 300)
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Cross-sells'
                    placeholder='Search products'
                    margin='normal'
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isSearchingProducts ? <CircularProgress color='inherit' size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
              />
            </Paper>
          </Box>
        )}
      </form>
    </Paper>
  )
}
