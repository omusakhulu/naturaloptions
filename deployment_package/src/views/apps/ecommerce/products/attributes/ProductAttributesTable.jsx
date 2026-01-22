'use client'

import { useEffect, useMemo, useState } from 'react'

import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import TablePagination from '@mui/material/TablePagination'

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

import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'
import tableStyles from '@core/styles/table.module.css'

import AddAttributeDrawer from './AddAttributeDrawer'
import ManageTermsDialog from './ManageTermsDialog'

const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const columnHelper = createColumnHelper()

export default function ProductAttributesTable() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [manageTermsAttr, setManageTermsAttr] = useState(null)

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: ({ row }) => (
          <div className='flex flex-col items-start'>
            <Typography className='font-medium' color='text.primary'>
              {row.original.name}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {row.original.slug}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('type', { header: 'Type' }),
      columnHelper.accessor('order_by', { header: 'Order By' }),
      columnHelper.accessor('has_archives', {
        header: 'Archives',
        cell: ({ row }) => <Typography>{row.original.has_archives ? 'Yes' : 'No'}</Typography>
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Button size='small' variant='tonal' onClick={() => setManageTermsAttr(row.original)}>
              Manage Terms
            </Button>
            <Button
              size='small'
              variant='tonal'
              color='error'
              onClick={async () => {
                const id = row.original.id
                const ok = window.confirm('Delete this attribute and its terms? This action cannot be undone.')
                if (!ok) return

                try {
                  const res = await fetch(`/api/woocommerce/attributes/${id}`, { method: 'DELETE' })
                  if (!res.ok) throw new Error(await res.text())

                  setData(prev => prev.filter(attr => attr.id !== id))
                  if (manageTermsAttr?.id === id) setManageTermsAttr(null)
                } catch (e) {
                  console.error('Failed to delete attribute', e)
                }
              }}
            >
              Delete
            </Button>
          </div>
        )
      })
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const loadAttributes = async () => {
    try {
      const res = await fetch('/api/woocommerce/attributes', { cache: 'no-store' })
      const json = await res.json()

      if (!res.ok || !json?.success) throw new Error(json?.error || `API ${res.status}`)
      setData(Array.isArray(json.attributes) ? json.attributes : [])
    } catch (e) {
      console.error('Failed to load attributes', e)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttributes()
  }, [])

  if (loading) {
    return (
      <Card className='flex items-center justify-center p-12'>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress />
          <Typography>Loading attributes...</Typography>
        </Box>
      </Card>
    )
  }

  return (
    <Card sx={{ width: '100%' }}>
      <div className='flex flex-wrap items-center justify-between gap-4 p-6 w-full'>
        <div className='flex items-center gap-4'>
          <CustomTextField
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(String(e.target.value))}
            placeholder='Search attribute...'
            className='is-72'
          />
        </div>
        <Button variant='contained' onClick={() => setAddOpen(true)} startIcon={<i className='tabler-plus' />}>
          Add Attribute
        </Button>
      </div>

      <div className='overflow-x-auto w-full'>
        <table className={tableStyles.table} style={{ width: '100%', tableLayout: 'fixed' }}>
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id}>
                    {h.isPlaceholder ? null : (
                      <div
                        className={classnames({
                          'flex items-center': h.column.getIsSorted(),
                          'cursor-pointer select-none': h.column.getCanSort()
                        })}
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {{
                          asc: <i className='tabler-chevron-up text-xl' />,
                          desc: <i className='tabler-chevron-down text-xl' />
                        }[h.column.getIsSorted()] ?? null}
                      </div>
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
                .map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
            </tbody>
          )}
        </table>
      </div>

      <TablePagination
        component={() => <TablePaginationComponent table={table} />}
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        onPageChange={(_, page) => table.setPageIndex(page)}
      />

      <AddAttributeDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          setAddOpen(false)
          setLoading(true)
          loadAttributes()
        }}
      />
      <ManageTermsDialog attribute={manageTermsAttr} onClose={() => setManageTermsAttr(null)} />
    </Card>
  )
}
