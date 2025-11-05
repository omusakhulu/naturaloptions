'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

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
import AddCategoryDrawer from './AddCategoryDrawer'
import OptionMenu from '@core/components/option-menu'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

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
const categoryData = []

// Column Definitions
const columnHelper = createColumnHelper()

const ProductCategoryTable = () => {
  // States
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [category, setCategory] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)

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
        header: 'Categories',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <div className='flex flex-col items-start'>
              <Typography className='font-medium' color='text.primary'>
                {row.original.name}
              </Typography>
              <Typography variant='body2'>{row.original.description}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('count', {
        header: 'Total Products',
        cell: ({ row }) => <Typography>{row.original.count}</Typography>
      }),
      columnHelper.accessor('actions', {
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <IconButton
              onClick={() => {
                setEditingCategory(row.original)
                setAddCategoryOpen(true)
              }}
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
                      const id = row.original.id

                      try {
                        const res = await fetch(`/api/woocommerce/categories/${id}`, { method: 'DELETE' })

                        if (!res.ok) throw new Error(await res.text())

                        setData(prev => prev.filter(category => category.id !== id))
                      } catch (err) {
                        console.error('Failed to delete category', err)
                      }
                    }
                  }
                },
                { text: 'Duplicate', icon: 'tabler-copy' }
              ]}
            />
          </div>
        ),
        enableSorting: false
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
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

  const loadWooCategories = async () => {
    try {
      const res = await fetch('/api/woocommerce/categories', { cache: 'no-store' })
      const json = await res.json()

      if (!res.ok || !json?.success) throw new Error(json?.error || `API error: ${res.status}`)
      const categoriesArray = Array.isArray(json.categories) ? json.categories : []

      setData(categoriesArray)
    } catch (error) {
      console.error('Error fetching Woo categories:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWooCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show loading state
  if (loading) {
    return (
      <Card className='flex items-center justify-center p-12'>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress />
          <Typography>Loading categories...</Typography>
        </Box>
      </Card>
    )
  }

  return (
    <Card sx={{ width: '100%' }}>
      <div className='flex flex-wrap items-center justify-between gap-4 p-6 w-full'>
        <div className='flex items-center gap-4'>
          <CustomTextField
            select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className='is-[140px]'
            disabled={data.length === 0}
          >
            <MenuItem value=''>All Categories</MenuItem>
            {data.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </CustomTextField>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search category...'
            className='is-72'
            disabled={data.length === 0}
          />
        </div>
        <Button variant='contained' onClick={() => setAddCategoryOpen(true)} startIcon={<i className='tabler-plus' />}>
          Add Category
        </Button>
      </div>
      <div className='overflow-x-auto w-full'>
        <table className={tableStyles.table} style={{ width: '100%', tableLayout: 'fixed' }}>
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
      <AddCategoryDrawer
        open={addCategoryOpen}
        categoryData={data}
        setData={setData}
        editingCategory={editingCategory}
        handleClose={() => {
          setAddCategoryOpen(!addCategoryOpen)
          setEditingCategory(null)
        }}
        onSaved={loadWooCategories}
      />
    </Card>
  )
}

export default ProductCategoryTable
