'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'

// Component Imports
import TableFilters from './TableFilters'
import CustomAvatar from '@core/components/mui/Avatar'
import CustomTextField from '@core/components/mui/TextField'
import OptionMenu from '@core/components/option-menu'
import TablePaginationComponent from '@components/TablePaginationComponent'
import { getCategoryInfo } from '@/utils/categories'
import SyncPriceButton from '@/components/products/SyncPriceButton'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const fuzzyFilter = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  // States
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])
  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// Vars
const productStatusObj = {
  Scheduled: { title: 'Scheduled', color: 'warning' },
  Published: { title: 'Publish', color: 'success' },
  Inactive: { title: 'Inactive', color: 'error' }
}

// Column Definitions
const columnHelper = createColumnHelper()

const ProductListTable = ({ productData }) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(productData || [])
  const [filteredData, setFilteredData] = useState(productData || [])
  const [globalFilter, setGlobalFilter] = useState('')
  const [isClient, setIsClient] = useState(false)

  // Set isClient to true after component mounts (client-side only)
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Hooks
  const { lang: locale } = useParams()

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              indeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler()
            }}
          />
        )
      },
      columnHelper.accessor('productName', {
        header: 'Product',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <img src={row.original.image} width={38} height={38} className='rounded bg-actionHover' />
            <div className='flex flex-col'>
              <Typography className='font-medium' color='text.primary'>
                {row.original.productName}
              </Typography>
              <Typography variant='body2'>{row.original.productBrand}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: ({ row }) => {
          const category = row.original.category
          let categoryName = 'Uncategorized'
          let categoryId = ''
          let categorySlug = ''

          // Handle array of category objects
          if (Array.isArray(category) && category.length > 0) {
            // Take the first category if multiple exist
            const firstCategory = category[0]

            // Handle nested id object format: {id: {id, name, slug}, name: string}
            if (firstCategory.id && typeof firstCategory.id === 'object') {
              categoryName = firstCategory.id.name || 'Uncategorized'
              categoryId = firstCategory.id.id || ''
              categorySlug = firstCategory.id.slug || ''
            }

            // Handle direct category object
            else if (firstCategory.name) {
              categoryName = firstCategory.name
              categoryId = firstCategory.id || ''
              categorySlug = firstCategory.slug || ''
            }
          }

          // Handle single category object
          else if (category && typeof category === 'object') {
            // Handle nested id object format
            if (category.id && typeof category.id === 'object') {
              categoryName = category.id.name || 'Uncategorized'
              categoryId = category.id.id || ''
              categorySlug = category.id.slug || ''
            }

            // Handle direct category properties
            else if (category.name) {
              categoryName = category.name
              categoryId = category.id || ''
              categorySlug = category.slug || ''
            }

            // Fallback to any string value
            else {
              const stringValue = Object.values(category).find(
                val => val && typeof val === 'string' && val.trim().length > 0
              )

              categoryName = stringValue ? stringValue.trim() : 'Uncategorized'
            }
          }

          // Handle string category
          else if (typeof category === 'string') {
            categoryName = category.trim() || 'Uncategorized'
          }

          // Only render the avatar on the client to avoid hydration mismatch
          const categoryInfo = isClient ? getCategoryInfo(categoryName) : { color: 'default', icon: 'tabler-tag' }

          return (
            <div className='flex items-center gap-4'>
              <CustomAvatar key={`${categoryName}-avatar`} skin='light' color={categoryInfo.color} size={30}>
                <i className={classnames(categoryInfo.icon, 'text-lg')} />
              </CustomAvatar>
              <Typography color='text.primary'>{categoryName}</Typography>
            </div>
          )
        }
      }),

      // Visibility toggle (WooCommerce catalog_visibility)
      columnHelper.accessor('catalog_visibility', {
        header: 'Visible',
        cell: ({ row }) => {
          const isVisible = (row.original.catalog_visibility || 'visible') !== 'hidden'

          return (
            <Switch
              checked={isVisible}
              onChange={async e => {
                const productId = row.original.wooId || row.original.id
                const newVisible = e.target.checked
                const newValue = newVisible ? 'visible' : 'hidden'

                try {
                  const res = await fetch(`/api/products/${productId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ catalog_visibility: newValue })
                  })

                  if (!res.ok) throw new Error(await res.text())

                  // Update UI immediately; keep the row visible in admin
                  setData(prev =>
                    prev.map(p => (p.id === row.original.id ? { ...p, catalog_visibility: newValue } : p))
                  )
                  setFilteredData(prev =>
                    prev.map(p => (p.id === row.original.id ? { ...p, catalog_visibility: newValue } : p))
                  )
                } catch (err) {
                  // Revert switch by forcing a re-render through state reset
                  setData(prev => [...prev])
                  setFilteredData(prev => [...prev])
                  console.error('Failed to update visibility', err)
                }
              }}
            />
          )
        },
        enableSorting: false
      }),
      columnHelper.accessor('stock', {
        header: 'Stock',
        cell: ({ row }) => <Switch defaultChecked={row.original.stock} />,
        enableSorting: false
      }),
      columnHelper.accessor('sku', {
        header: 'SKU',
        cell: ({ row }) => <Typography>{row.original.sku}</Typography>
      }),
      columnHelper.accessor('price', {
        header: 'Price',
        cell: ({ row }) => <Typography>{row.original.price}</Typography>
      }),
      columnHelper.accessor('qty', {
        header: 'QTY',
        cell: ({ row }) => <Typography>{row.original.qty}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip
            label={productStatusObj[row.original.status].title}
            variant='tonal'
            color={productStatusObj[row.original.status].color}
            size='small'
          />
        )
      }),
      columnHelper.accessor('actions', {
        header: 'Actions',
        cell: ({ row }) => {
          const productId = row.original.wooId || row.original.id

          return (
            <div className='flex items-center'>
              <SyncPriceButton
                productId={productId}
                onSyncComplete={data => {
                  // Update the local data if needed
                  setData(prevData =>
                    prevData.map(product =>
                      product.wooId === productId || product.id === productId ? { ...product, ...data } : product
                    )
                  )
                }}
              />
              <IconButton
                component={Link}
                href={getLocalizedUrl(`/apps/ecommerce/products/edit/${row.original.id}`, locale)}
              >
                <i className='tabler-edit text-textSecondary' />
              </IconButton>
              <OptionMenu
                iconButtonProps={{ size: 'medium' }}
                iconClassName='text-textSecondary'
                options={[
                  { text: 'Download', icon: 'tabler-download' },
                  {
                    text: 'Delete',
                    icon: 'tabler-trash',
                    menuItemProps: {
                      onClick: async () => {
                        const productId = row.original.wooId || row.original.id

                        try {
                          const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' })

                          if (!res.ok) throw new Error(await res.text())

                          setData(prev => prev.filter(product => product.id !== row.original.id))
                          setFilteredData(prev => prev.filter(product => product.id !== row.original.id))
                        } catch (err) {
                          console.error('Failed to delete product', err)
                        }
                      }
                    }
                  },
                  { text: 'Duplicate', icon: 'tabler-copy' }
                ]}
              />
            </div>
          )
        },
        enableSorting: false
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, filteredData]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    enableRowSelection: true, //enable row selection for all rows
    // enableRowSelection: row => row.original.age > 18, // or enable row selection conditionally per row
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  return (
    <>
      <Card>
        <CardHeader title='Filters' />
        <TableFilters setData={setFilteredData} productData={data} />
        <Divider />
        <div className='flex flex-wrap justify-between gap-4 p-6'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search Product'
            className='max-sm:is-full'
          />
          <div className='flex flex-wrap items-center max-sm:flex-col gap-4 max-sm:is-full is-auto'>
            <CustomTextField
              select
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              className='flex-auto is-[70px] max-sm:is-full'
            >
              <MenuItem value='10'>10</MenuItem>
              <MenuItem value='25'>25</MenuItem>
              <MenuItem value='50'>50</MenuItem>
            </CustomTextField>
            <Button
              color='secondary'
              variant='tonal'
              className='max-sm:is-full is-auto'
              startIcon={<i className='tabler-upload' />}
            >
              Export
            </Button>
            <Button
              variant='contained'
              component={Link}
              className='max-sm:is-full is-auto'
              href={getLocalizedUrl('/apps/ecommerce/products/add', locale)}
              startIcon={<i className='tabler-plus' />}
            >
              Add Product
            </Button>
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <>
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className='tabler-chevron-up text-xl' />,
                              desc: <i className='tabler-chevron-down text-xl' />
                            }[header.column.getIsSorted()] ?? null}
                          </div>
                        </>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    No data available
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table
                  .getRowModel()
                  .rows.slice(0, table.getState().pagination.pageSize)
                  .map(row => {
                    return (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    )
                  })}
              </tbody>
            )}
          </table>
        </div>
        <TablePagination
          component={() => <TablePaginationComponent table={table} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => {
            table.setPageIndex(page)
          }}
        />
      </Card>
    </>
  )
}

export default ProductListTable
