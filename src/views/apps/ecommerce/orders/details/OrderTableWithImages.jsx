'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
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
import Link from '@components/Link'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper()

const OrderTableWithImages = ({ tableData = [] }) => {
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(tableData)
  const [globalFilter, setGlobalFilter] = useState('')
  const [productImages, setProductImages] = useState({})

  // Fetch product images on mount
  useEffect(() => {
    const fetchProductImages = async () => {
      try {
        const response = await fetch('/api/products/list')
        if (response.ok) {
          const result = await response.json()
          const images = {}
          result.products?.forEach(product => {
            images[product.name] = product.image
          })
          setProductImages(images)
        }
      } catch (error) {
        console.error('Failed to fetch product images:', error)
      }
    }

    fetchProductImages()
  }, [])

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
      columnHelper.accessor('name', {
        header: 'Product',
        cell: ({ row }) => {
          const productName = row.original.name || row.original.productName || 'Unknown Product'
          const productImage = row.original.image || row.original.productImage || productImages[productName]
          const brand = row.original.brand || ''

          return (
            <div className='flex items-center gap-3'>
              {productImage ? (
                <img src={productImage} alt={productName} height={34} className='rounded' />
              ) : (
                <div className='w-[34px] h-[34px] bg-gray-300 rounded flex items-center justify-center'>
                  <i className='tabler-photo-off text-sm' />
                </div>
              )}
              <div className='flex flex-col items-start'>
                <Typography color='text.primary' className='font-medium'>
                  {productName}
                </Typography>
                {brand && <Typography variant='body2'>{brand}</Typography>}
              </div>
            </div>
          )
        }
      }),
      columnHelper.accessor('price', {
        header: 'Price',
        cell: ({ row }) => {
          const price = row.original.price || row.original.subtotal || 0
          return <Typography>{`$${price}`}</Typography>
        }
      }),
      columnHelper.accessor('quantity', {
        header: 'Qty',
        cell: ({ row }) => <Typography>{`${row.original.quantity}`}</Typography>
      }),
      columnHelper.accessor('total', {
        header: 'Total',
        cell: ({ row }) => {
          const total = row.original.total || (row.original.quantity * row.original.price) || 0
          return <Typography>{`$${total}`}</Typography>
        }
      })
    ],
    [productImages]
  )

  const table = useReactTable({
    data: data,
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
    enableRowSelection: true,
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
          <tbody className='border-be'>
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
  )
}

export default OrderTableWithImages
