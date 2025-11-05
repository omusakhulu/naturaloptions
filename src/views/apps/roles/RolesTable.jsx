'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Avatar from '@mui/material/Avatar'
import Autocomplete from '@mui/material/Autocomplete'
import { styled } from '@mui/material/styles'

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
import CustomAvatar from '@core/components/mui/Avatar'
import OptionMenu from '@core/components/option-menu'
import CustomTextField from '@core/components/mui/TextField'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Styled Components
const Icon = styled('i')({})

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
const userRoleObj = {
  SUPER_ADMIN: { icon: 'tabler-shield-check', color: 'error', label: 'Super Admin' },
  ADMIN: { icon: 'tabler-user-shield', color: 'warning', label: 'Admin' },
  MANAGER: { icon: 'tabler-user-cog', color: 'info', label: 'Manager' },
  SALES: { icon: 'tabler-shopping-cart', color: 'success', label: 'Sales' },
  USER: { icon: 'tabler-user', color: 'default', label: 'User' },
  // Legacy roles for compatibility
  admin: { icon: 'tabler-crown', color: 'primary', label: 'Admin' },
  author: { icon: 'tabler-device-desktop', color: 'error', label: 'Author' },
  editor: { icon: 'tabler-edit', color: 'warning', label: 'Editor' },
  maintainer: { icon: 'tabler-chart-pie', color: 'info', label: 'Maintainer' },
  subscriber: { icon: 'tabler-user', color: 'success', label: 'Subscriber' }
}

const userStatusObj = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary'
}

// Column Definitions
const columnHelper = createColumnHelper()

const RolesTable = ({ tableData }) => {
  // States
  const [role, setRole] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(tableData || [])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({ open: false, userId: null, newRole: null, userName: '' })
  const [updating, setUpdating] = useState(false)
  const [assignDialog, setAssignDialog] = useState({ open: false, userId: null, userName: '', type: null })
  const [customers, setCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState([])

  // Hooks
  const { lang: locale } = useParams()

  // Update data when tableData changes
  useEffect(() => {
    if (tableData) {
      setData(tableData)
    }
  }, [tableData])

  // Update filteredData when data or role filter changes
  useEffect(() => {
    let filtered = data
    
    // Filter by role if a role is selected
    if (role && role !== '') {
      filtered = data.filter(user => user.role === role)
    }
    
    setFilteredData(filtered)
  }, [data, role])

  // Fetch customers when dialog opens for customer assignment
  useEffect(() => {
    if (assignDialog.open && assignDialog.type === 'customers') {
      fetchCustomers()
    }
  }, [assignDialog.open, assignDialog.type])

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true)
      const response = await fetch('/api/customers')
      
      if (!response.ok) throw new Error('Failed to fetch customers')
      
      const data = await response.json()
      
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoadingCustomers(false)
    }
  }

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
      columnHelper.accessor('fullName', {
        header: 'User',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {getAvatar({ avatar: row.original.avatar, fullName: row.original.fullName })}
            <div className='flex flex-col'>
              <Typography className='font-medium' color='text.primary'>
                {row.original.fullName}
              </Typography>
              <Typography variant='body2'>{row.original.username}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('role', {
        header: 'Role',
        cell: ({ row }) => {
          const currentRole = row.original.role
          const roleInfo = userRoleObj[currentRole] || userRoleObj.USER

          const handleRoleChange = (newRole) => {
            setConfirmDialog({
              open: true,
              userId: row.original.id,
              newRole,
              userName: row.original.fullName
            })
          }

          return (
            <FormControl size='small' className='min-w-[150px]'>
              <Select
                value={currentRole}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                {Object.entries(userRoleObj)
                  .filter(([key]) => key === key.toUpperCase()) // Only show uppercase roles
                  .map(([roleKey, roleConfig]) => (
                    <MenuItem key={roleKey} value={roleKey}>
                      <div className='flex items-center gap-2'>
                        <Icon className={roleConfig.icon} />
                        <span>{roleConfig.label}</span>
                      </div>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )
        }
      }),
      columnHelper.accessor('contact', {
        header: 'Contact',
        cell: ({ row }) => (
          <Typography color='text.primary'>
            {row.original.contact || row.original.phone || 'N/A'}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Chip
              variant='tonal'
              className='capitalize'
              label={row.original.status}
              size='small'
              color={userStatusObj[row.original.status]}
            />
          </div>
        )
      }),
      columnHelper.accessor('action', {
        header: 'Assignments',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='text-textSecondary'
              options={[
                {
                  text: 'eCommerce Operations',
                  icon: 'tabler-shopping-cart',
                  menuItemProps: { 
                    className: 'flex items-center gap-2 text-textSecondary',
                    onClick: () => setAssignDialog({ 
                      open: true, 
                      userId: row.original.id, 
                      userName: row.original.fullName,
                      type: 'ecommerce' 
                    })
                  }
                },
                {
                  text: 'Project Management',
                  icon: 'tabler-briefcase',
                  menuItemProps: { 
                    className: 'flex items-center gap-2 text-textSecondary',
                    onClick: () => setAssignDialog({ 
                      open: true, 
                      userId: row.original.id, 
                      userName: row.original.fullName,
                      type: 'projects' 
                    })
                  }
                },
                {
                  text: 'Warehouse Operations',
                  icon: 'tabler-building-warehouse',
                  menuItemProps: { 
                    className: 'flex items-center gap-2 text-textSecondary',
                    onClick: () => setAssignDialog({ 
                      open: true, 
                      userId: row.original.id, 
                      userName: row.original.fullName,
                      type: 'warehouse' 
                    })
                  }
                },
                {
                  text: 'Financial Operations',
                  icon: 'tabler-file-invoice',
                  menuItemProps: { 
                    className: 'flex items-center gap-2 text-textSecondary',
                    onClick: () => setAssignDialog({ 
                      open: true, 
                      userId: row.original.id, 
                      userName: row.original.fullName,
                      type: 'financial' 
                    })
                  }
                },
                {
                  text: 'Customer Management',
                  icon: 'tabler-user-check',
                  menuItemProps: { 
                    className: 'flex items-center gap-2 text-textSecondary',
                    onClick: () => setAssignDialog({ 
                      open: true, 
                      userId: row.original.id, 
                      userName: row.original.fullName,
                      type: 'customers' 
                    })
                  }
                },
                {
                  text: 'View All Assignments',
                  icon: 'tabler-list-check',
                  menuItemProps: { 
                    className: 'flex items-center gap-2 text-textSecondary',
                    onClick: () => setAssignDialog({ 
                      open: true, 
                      userId: row.original.id, 
                      userName: row.original.fullName,
                      type: 'view' 
                    })
                  }
                }
              ]}
            />
          </div>
        ),
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

  const getAvatar = params => {
    const { avatar, fullName } = params

    if (avatar) {
      return <CustomAvatar src={avatar} skin='light' size={34} />
    } else {
      return (
        <CustomAvatar skin='light' size={34}>
          {getInitials(fullName)}
        </CustomAvatar>
      )
    }
  }

  useEffect(() => {
    const filteredData = data?.filter(user => {
      if (role && user.role !== role) return false

      return true
    })

    setFilteredData(filteredData)
  }, [role, data, setFilteredData])

  return (
    <Card>
      <CardContent className='flex justify-between flex-col gap-4 items-start sm:flex-row sm:items-center'>
        <div className='flex items-center gap-2'>
          <Typography>Show</Typography>
          <CustomTextField
            select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className='max-sm:is-full sm:is-[70px]'
          >
            <MenuItem value='10'>10</MenuItem>
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
          </CustomTextField>
        </div>
        <div className='flex gap-4 flex-col !items-start max-sm:is-full sm:flex-row sm:items-center'>
          <DebouncedInput
            value={globalFilter ?? ''}
            className='max-sm:is-full min-is-[250px]'
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Search User'
          />
          <CustomTextField
            select
            value={role}
            onChange={e => setRole(e.target.value)}
            id='roles-app-role-select'
            className='max-sm:is-full sm:is-[160px]'
            slotProps={{
              select: { displayEmpty: true }
            }}
          >
            <MenuItem value=''>All Roles</MenuItem>
            <MenuItem value='SUPER_ADMIN'>Super Admin</MenuItem>
            <MenuItem value='ADMIN'>Admin</MenuItem>
            <MenuItem value='MANAGER'>Manager</MenuItem>
            <MenuItem value='SALES'>Sales</MenuItem>
            <MenuItem value='USER'>User</MenuItem>
          </CustomTextField>
        </div>
      </CardContent>
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

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => !updating && setConfirmDialog({ open: false, userId: null, newRole: null, userName: '' })}
      >
        <DialogTitle>Confirm Role Change</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to change <strong>{confirmDialog.userName}'s</strong> role to{' '}
            <strong>{userRoleObj[confirmDialog.newRole]?.label}</strong>?
            <br /><br />
            This will change their permissions immediately.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ open: false, userId: null, newRole: null, userName: '' })}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button 
            onClick={async () => {
              setUpdating(true)
              
              try {
                const response = await fetch(`/api/users/${confirmDialog.userId}/role`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ role: confirmDialog.newRole })
                })

                if (!response.ok) throw new Error('Failed to update role')

                // Update local state
                setData(data.map(user => 
                  user.id === confirmDialog.userId ? { ...user, role: confirmDialog.newRole } : user
                ))

                setConfirmDialog({ open: false, userId: null, newRole: null, userName: '' })
              } catch (err) {
                console.error('Error updating role:', err)
                alert('Failed to update user role')
              } finally {
                setUpdating(false)
              }
            }} 
            variant='contained' 
            color='primary'
            disabled={updating}
          >
            {updating ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog 
        open={assignDialog.open} 
        onClose={() => {
          setAssignDialog({ open: false, userId: null, userName: '', type: null })
          setSelectedCustomers([])
        }}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {assignDialog.type === 'ecommerce' && `Assign ${assignDialog.userName} to eCommerce Operations`}
          {assignDialog.type === 'projects' && `Assign ${assignDialog.userName} to Project Management`}
          {assignDialog.type === 'warehouse' && `Assign ${assignDialog.userName} to Warehouse Operations`}
          {assignDialog.type === 'financial' && `Assign ${assignDialog.userName} to Financial Operations`}
          {assignDialog.type === 'customers' && `Assign ${assignDialog.userName} to Customer Management`}
          {assignDialog.type === 'view' && `${assignDialog.userName}'s Assignments`}
        </DialogTitle>
        <DialogContent dividers>
          <div className='flex flex-col gap-4'>
            {assignDialog.type === 'view' ? (
              // View all assignments
              <div>
                <Typography variant='subtitle2' gutterBottom>Current Assignments</Typography>
                <div className='flex flex-col gap-2 mt-2'>
                  <Chip 
                    label='eCommerce Operations' 
                    icon={<i className='tabler-shopping-cart' />}
                    color='primary'
                    onDelete={() => {}} 
                  />
                  <Chip 
                    label='Project Management' 
                    icon={<i className='tabler-briefcase' />}
                    color='info'
                    onDelete={() => {}} 
                  />
                  <Chip 
                    label='Warehouse Operations' 
                    icon={<i className='tabler-building-warehouse' />}
                    color='warning'
                    onDelete={() => {}} 
                  />
                </div>
                <Typography variant='caption' color='text.secondary' className='mt-4 block'>
                  Click the × icon to remove an assignment
                </Typography>
              </div>
            ) : (
              // Assignment form
              <div className='flex flex-col gap-4'>
                <Typography variant='body2' color='text.secondary'>
                  {assignDialog.type === 'ecommerce' && (
                    <>Assign {assignDialog.userName} to specific eCommerce operations. This includes managing products, orders, and customer interactions.</>
                  )}
                  {assignDialog.type === 'projects' && (
                    <>Assign {assignDialog.userName} to specific projects. They will have access to project details, BOQs, and cost reports.</>
                  )}
                  {assignDialog.type === 'warehouse' && (
                    <>Assign {assignDialog.userName} to specific warehouses. They will manage inventory, stock levels, and warehouse operations.</>
                  )}
                  {assignDialog.type === 'financial' && (
                    <>Assign {assignDialog.userName} to financial operations. This includes invoices, packing slips, and financial reports.</>
                  )}
                  {assignDialog.type === 'customers' && (
                    <>Search and select customers to assign to {assignDialog.userName}. They will be the primary contact for these customers.</>
                  )}
                </Typography>
                
                {/* Customer Autocomplete - Real data */}
                {assignDialog.type === 'customers' && (
                  <Autocomplete
                    multiple
                    fullWidth
                    options={customers}
                    loading={loadingCustomers}
                    value={selectedCustomers}
                    onChange={(event, newValue) => setSelectedCustomers(newValue)}
                    getOptionLabel={(option) => option.fullName || option.email || 'Unknown'}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                      <CustomTextField
                        {...params}
                        placeholder='Search customers by name, email, or company...'
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingCustomers ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <div className='flex items-center gap-3 py-2 w-full'>
                          <Avatar src={option.avatar} alt={option.fullName} sx={{ width: 32, height: 32 }}>
                            {option.fullName?.[0]?.toUpperCase()}
                          </Avatar>
                          <div className='flex flex-col flex-1'>
                            <Typography variant='body2' fontWeight={500}>
                              {option.fullName}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {option.email} {option.company && `• ${option.company}`}
                            </Typography>
                          </div>
                        </div>
                      </li>
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={option.id}
                          avatar={<Avatar src={option.avatar}>{option.fullName?.[0]}</Avatar>}
                          label={option.fullName}
                          size='small'
                        />
                      ))
                    }
                    filterOptions={(options, { inputValue }) => {
                      const searchLower = inputValue.toLowerCase()
                      
                      return options.filter(option =>
                        option.fullName?.toLowerCase().includes(searchLower) ||
                        option.email?.toLowerCase().includes(searchLower) ||
                        option.company?.toLowerCase().includes(searchLower)
                      )
                    }}
                    noOptionsText={loadingCustomers ? 'Loading customers...' : 'No customers found'}
                  />
                )}

                {/* Sample list for other types - Replace with real data later */}
                {assignDialog.type !== 'customers' && (
                  <div className='flex flex-col gap-2 max-h-[300px] overflow-y-auto'>
                    {assignDialog.type === 'ecommerce' && (
                      <>
                        <Card variant='outlined' className='p-3 cursor-pointer hover:bg-action-hover'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <i className='tabler-package text-2xl' />
                              <div>
                                <Typography variant='body2' fontWeight={500}>Product Management</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  Manage products, categories, attributes
                                </Typography>
                              </div>
                            </div>
                            <Checkbox />
                          </div>
                        </Card>
                        <Card variant='outlined' className='p-3 cursor-pointer hover:bg-action-hover'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <i className='tabler-shopping-bag text-2xl' />
                              <div>
                                <Typography variant='body2' fontWeight={500}>Order Processing</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  Process and manage customer orders
                                </Typography>
                              </div>
                            </div>
                            <Checkbox />
                          </div>
                        </Card>
                      </>
                    )}
                    
                    {assignDialog.type === 'projects' && (
                      <>
                        <Card variant='outlined' className='p-3 cursor-pointer hover:bg-action-hover'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <i className='tabler-briefcase text-2xl' />
                              <div>
                                <Typography variant='body2' fontWeight={500}>Event Setup Q1 2025</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  Due: Jan 15, 2025 • Status: In Progress
                                </Typography>
                              </div>
                            </div>
                            <Checkbox />
                          </div>
                        </Card>
                        <Card variant='outlined' className='p-3 cursor-pointer hover:bg-action-hover'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <i className='tabler-briefcase text-2xl' />
                              <div>
                                <Typography variant='body2' fontWeight={500}>Wedding Venue Setup</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  Due: Feb 20, 2025 • Status: Planning
                                </Typography>
                              </div>
                            </div>
                            <Checkbox />
                          </div>
                        </Card>
                      </>
                    )}
                    
                    {assignDialog.type === 'warehouse' && (
                      <>
                        <Card variant='outlined' className='p-3 cursor-pointer hover:bg-action-hover'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <i className='tabler-building-warehouse text-2xl' />
                              <div>
                                <Typography variant='body2' fontWeight={500}>Main Warehouse - Nairobi</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  Location: Industrial Area • Capacity: 80%
                                </Typography>
                              </div>
                            </div>
                            <Checkbox />
                          </div>
                        </Card>
                        <Card variant='outlined' className='p-3 cursor-pointer hover:bg-action-hover'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <i className='tabler-building-warehouse text-2xl' />
                              <div>
                                <Typography variant='body2' fontWeight={500}>Branch Warehouse - Mombasa</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  Location: Mombasa Road • Capacity: 45%
                                </Typography>
                              </div>
                            </div>
                            <Checkbox />
                          </div>
                        </Card>
                      </>
                    )}
                    
                    {assignDialog.type === 'financial' && (
                      <>
                        <Card variant='outlined' className='p-3 cursor-pointer hover:bg-action-hover'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <i className='tabler-file-invoice text-2xl' />
                              <div>
                                <Typography variant='body2' fontWeight={500}>Invoice Management</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  Create, view, and manage invoices
                                </Typography>
                              </div>
                            </div>
                            <Checkbox />
                          </div>
                        </Card>
                        <Card variant='outlined' className='p-3 cursor-pointer hover:bg-action-hover'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <i className='tabler-report-money text-2xl' />
                              <div>
                                <Typography variant='body2' fontWeight={500}>Cost Reports</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  Access project cost reports and analytics
                                </Typography>
                              </div>
                            </div>
                            <Checkbox />
                          </div>
                        </Card>
                      </>
                    )}
                  </div>
                )}

                {selectedCustomers.length > 0 && assignDialog.type === 'customers' && (
                  <div className='bg-success-light p-3 rounded'>
                    <Typography variant='caption' color='text.secondary'>
                      <strong>{selectedCustomers.length} customer{selectedCustomers.length > 1 ? 's' : ''} selected</strong>
                    </Typography>
                  </div>
                )}

                <div className='bg-info-light p-3 rounded'>
                  <Typography variant='caption' color='text.secondary'>
                    <strong>Note:</strong> Selected items will be assigned to this user. They will receive notifications about updates.
                  </Typography>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAssignDialog({ open: false, userId: null, userName: '', type: null })
            setSelectedCustomers([])
          }}>
            {assignDialog.type === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {assignDialog.type !== 'view' && (
            <Button 
              variant='contained' 
              color='primary'
              disabled={assignDialog.type === 'customers' && selectedCustomers.length === 0}
            >
              Assign {assignDialog.type === 'customers' && selectedCustomers.length > 0 && `(${selectedCustomers.length})`}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default RolesTable
