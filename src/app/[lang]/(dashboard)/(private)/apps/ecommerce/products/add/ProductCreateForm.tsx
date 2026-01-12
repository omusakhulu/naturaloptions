'use client'

import { useEffect, useMemo, useState } from 'react'

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
import Autocomplete from '@mui/material/Autocomplete'
import SaveIcon from '@mui/icons-material/SaveAlt'

import ProductAddHeader from '@views/apps/ecommerce/products/add/ProductAddHeader'
import MediaUploader, { type UploadedMedia } from '@/components/products/MediaUploader'

// Local buying price utilities
import { getBuyingPriceBySku, setBuyingPriceBySku } from '@/utils/buyingPriceUtils'

type StockStatus = 'instock' | 'outofstock' | 'onbackorder'

interface ProductCreateFormData {
  name: string
  sku: string
  regular_price: string | number
  sale_price?: string | number
  buying_price?: string | number
  stock_status: StockStatus
  stock_quantity: string | number
  description?: string
  short_description?: string
  catalog_visibility?: 'visible' | 'catalog' | 'search' | 'hidden'
  manage_stock?: boolean
  backorders?: 'no' | 'notify' | 'yes'
  low_stock_amount?: string | number
  categories_csv?: string
  tags_csv?: string
  weight?: string | number
  length?: string | number
  width?: string | number
  height?: string | number
  shipping_class?: string
}

const ProductCreateForm: React.FC = () => {
  const router = useRouter()
  const params = useParams()
  const lang = Array.isArray((params as any)?.lang) ? (params as any).lang[0] : (params as any)?.lang || 'en'

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [media, setMedia] = useState<UploadedMedia[]>([])
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
  const [tags, setTags] = useState<Array<{ id: number; name: string }>>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [buyingPrice, setBuyingPrice] = useState('')

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

  // Build attribute definitions (with term objects) for variation generation
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

  // Generate cartesian product of selected variation terms
  const generateVariations = () => {
    const defs = getVariationAttributeDefs()

    if (!defs.length) {
      toast.error('Select at least one attribute with terms and mark it as "Used for variations"')

      return
    }

    const combos: Array<Array<{ id: number; name: string; option: string }>> = [] as any

    // Start with first attribute's terms
    let acc: Array<Array<{ id: number; name: string; option: string }>> = defs[0].terms.map(t => [
      { id: defs[0].id, name: defs[0].name, option: t.name }
    ])

    for (let i = 1; i < defs.length; i++) {
      const next: Array<Array<{ id: number; name: string; option: string }>> = []

      for (const partial of acc) {
        for (const t of defs[i].terms) {
          next.push([...partial, { id: defs[i].id, name: defs[i].name, option: t.name }])
        }
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
          stock_status: 'instock' as const,
          manage_stock: false
        }
      )
    })

    setVariations(newVars)
    toast.success(`Generated ${newVars.length} variations`)
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<ProductCreateFormData>({
    defaultValues: {
      stock_status: 'instock',
      stock_quantity: 0,
      catalog_visibility: 'visible'
    }
  })

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
      } catch {}
    }

    loadTaxonomy()
  }, [])

  useEffect(() => {
    const loadAttributes = async () => {
      try {
        const res = await fetch('/api/woocommerce/attributes', { cache: 'no-store' })
        const json = await res.json()

        if (res.ok && json?.success) setWooAttributes(Array.isArray(json.attributes) ? json.attributes : [])
      } catch {}
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
  const handleBuyingPriceChange = (value: string, sku: string) => {
    setBuyingPrice(value)
    // Save to local storage when SKU exists
    if (sku && value && !isNaN(parseFloat(value))) {
      setBuyingPriceBySku(sku, parseFloat(value))
    }
  }

  const onSubmit: SubmitHandler<ProductCreateFormData> = async data => {
    setIsLoading(true)
    setError('')

    try {
      // Save buying price to local storage
      if (data.sku && data.buying_price && !isNaN(Number(data.buying_price))) {
        setBuyingPriceBySku(data.sku.trim(), Number(data.buying_price))
      }

      const payload: any = {
        name: (data.name || '').trim(),
        sku: (data.sku || '').trim(),
        regular_price: data.regular_price ? String(data.regular_price) : '0',
        sale_price: data.sale_price ? String(data.sale_price) : '',
        price: data.regular_price ? String(data.regular_price) : '0',
        stock_quantity: parseInt(String(data.stock_quantity || '0')),
        stock_status: data.stock_status || 'instock',
        status: 'publish',
        type: variations.length > 0 ? 'variable' : 'simple',
        catalog_visibility: data.catalog_visibility || 'visible'
      }

      if (typeof data.description === 'string') payload.description = data.description
      if (typeof data.short_description === 'string') payload.short_description = data.short_description

      // Dimensions & shipping
      const dims: any = {}

      if (data.length !== undefined && data.length !== '') dims.length = String(data.length)
      if (data.width !== undefined && data.width !== '') dims.width = String(data.width)
      if (data.height !== undefined && data.height !== '') dims.height = String(data.height)
      if (Object.keys(dims).length) payload.dimensions = dims
      if (data.weight !== undefined && data.weight !== '') payload.weight = String(data.weight)
      if (data.shipping_class) payload.shipping_class = data.shipping_class

      // Categories & Tags
      if (selectedCategoryIds.length) payload.categories = selectedCategoryIds.map(id => ({ id }))
      if (selectedTagIds.length) payload.tags = selectedTagIds.map(id => ({ id }))

      // Media
      if (media && media.length) payload.images = media.map(m => (m.id ? { id: m.id } : { src: m.url }))

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

      if (attributesPayload.length) payload.attributes = attributesPayload

      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.success) throw new Error(json?.error || 'Failed to create product')

      // If we have variations, create them now via our API
      try {
        if (variations.length) {
          const createdWooId = Number(
            json?.data?.wooProductId ?? json?.wooProductId ?? json?.data?.product?.wooId ?? json?.product?.id
          )

          if (!createdWooId || Number.isNaN(createdWooId)) throw new Error('Missing WooCommerce product ID')

          const body = {
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
          }

          const upRes = await fetch(`/api/products/${createdWooId}/variations`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          })

          if (!upRes.ok) {
            const errTxt = await upRes.text()

            console.error('Variation upsert failed:', errTxt)
            toast.error('Variations could not be created')
          } else {
            toast.success('Product and variations created')
          }
        } else {
          toast.success('Product created')
        }
      } catch (ve) {
        console.error('Failed to create variations:', ve)
        toast.error('Product created, but variations failed')
      }

      router.push(`/${lang}/apps/ecommerce/products/list`)
    } catch (err: any) {
      setError(err?.message || 'Failed to create product')
      toast.error(err?.message || 'Failed to create product')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Paper sx={{ p: 5 }}>
      <ProductAddHeader isEdit={false as any} product={null as any} />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 360px' }, gap: 3, alignItems: 'start' }}>
          <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='h6' gutterBottom>
                Product Information
              </Typography>
              <TextField
                label='Product Name'
                fullWidth
                margin='normal'
                {...register('name', { required: 'Required' })}
                error={!!errors.name}
                helperText={errors.name?.message}
                disabled={isLoading}
              />
              <TextField label='SKU' fullWidth margin='normal' {...register('sku')} disabled={isLoading} />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label='Regular Price'
                  type='number'
                  inputProps={{ min: 0, step: '0.01' }}
                  {...register('regular_price', { required: 'Required' })}
                  disabled={isLoading}
                />
                <TextField
                  label='Sale Price'
                  type='number'
                  inputProps={{ min: 0, step: '0.01' }}
                  {...register('sale_price')}
                  disabled={isLoading}
                />
              </Box>
              <TextField
                label='Buying Price'
                type='number'
                inputProps={{ min: 0, step: '0.01' }}
                value={buyingPrice}
                {...register('buying_price')}
                onChange={(e) => {
                  const sku = watch('sku') || ''
                  handleBuyingPriceChange(e.target.value, sku)
                }}
                disabled={isLoading}
                helperText='Stored locally for stock calculations'
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <FormControl margin='normal' fullWidth disabled={isLoading}>
                  <InputLabel>Stock Status</InputLabel>
                  <Select label='Stock Status' defaultValue={'instock' as any} {...register('stock_status')}>
                    <MenuItem value={'instock' as any}>In Stock</MenuItem>
                    <MenuItem value={'outofstock' as any}>Out of Stock</MenuItem>
                    <MenuItem value={'onbackorder' as any}>On Backorder</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label='Stock Quantity'
                  type='number'
                  inputProps={{ min: 0 }}
                  {...register('stock_quantity')}
                  disabled={isLoading}
                />
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={watch('catalog_visibility') !== 'hidden'}
                    onChange={e => setValue('catalog_visibility', e.target.checked ? 'visible' : 'hidden')}
                    disabled={isLoading}
                  />
                }
                label='Visible to customers'
              />
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
                  No variations generated yet.
                </Typography>
              ) : (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  {variations.map((v, idx) => (
                    <Box
                      key={v.key}
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
                Categories & Tags
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Autocomplete
                  multiple
                  options={categories}
                  getOptionLabel={o => o.name}
                  value={categories.filter(c => selectedCategoryIds.includes(c.id))}
                  onChange={(_, v) => setSelectedCategoryIds(v.map(x => x.id))}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip {...getTagProps({ index })} key={option.id} label={option.name} />
                    ))
                  }
                  renderInput={params => <TextField {...params} label='Categories' placeholder='Search categories' />}
                />
                <Autocomplete
                  multiple
                  options={tags}
                  getOptionLabel={o => o.name}
                  value={tags.filter(t => selectedTagIds.includes(t.id))}
                  onChange={(_, v) => setSelectedTagIds(v.map(x => x.id))}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip {...getTagProps({ index })} key={option.id} label={option.name} />
                    ))
                  }
                  renderInput={params => <TextField {...params} label='Tags' placeholder='Search tags' />}
                />
              </Box>
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

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='h6' gutterBottom>
                Descriptions
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
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='h6' gutterBottom>
                Shipping
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                <TextField label='Weight' {...register('weight')} disabled={isLoading} />
                <TextField label='Length' {...register('length')} disabled={isLoading} />
                <TextField label='Width' {...register('width')} disabled={isLoading} />
                <TextField label='Height' {...register('height')} disabled={isLoading} />
              </Box>
              <TextField
                label='Shipping Class'
                fullWidth
                margin='normal'
                {...register('shipping_class')}
                disabled={isLoading}
              />
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
                {isLoading ? 'Saving...' : 'Create Product'}
              </Button>

              {error && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                  <Typography variant='body2' color='error.contrastText'>
                    {error}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      </form>
    </Paper>
  )
}

export default ProductCreateForm
