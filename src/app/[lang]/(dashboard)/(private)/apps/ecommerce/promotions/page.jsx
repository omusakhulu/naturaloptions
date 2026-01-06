'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation'
import {
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { Add, Edit, Delete, LocalOffer, ContentCopy } from '@mui/icons-material'

export default function PromotionsPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteDialog, setDeleteDialog] = useState({ open: false, coupon: null })
  const params = useParams()
  const router = useRouter()
  const lang = params?.lang || 'en'

  const loadCoupons = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/promotions')
      setCoupons(res.data)
      setError('')
    } catch (err) {
      setError('Failed to load coupons')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  const handleDelete = async () => {
    if (!deleteDialog.coupon) return
    
    try {
      await axios.delete(`/api/promotions?id=${deleteDialog.coupon.id}`)
      setDeleteDialog({ open: false, coupon: null })
      loadCoupons()
    } catch (err) {
      alert('Failed to delete coupon')
      console.error(err)
    }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    alert(`Coupon code "${code}" copied to clipboard!`)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No expiry'
    return new Date(dateString).toLocaleDateString()
  }

  const getDiscountDisplay = (coupon) => {
    if (coupon.discount_type === 'percent') {
      return `${coupon.amount}%`
    } else if (coupon.discount_type === 'fixed_cart') {
      return `$${coupon.amount}`
    } else if (coupon.discount_type === 'fixed_product') {
      return `$${coupon.amount} per item`
    }
    return coupon.amount
  }

  return (
    <div className='p-8'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-semibold'>Promotions & Coupons</h1>
          <p className='text-gray-600 mt-1'>
            Manage store-wide promotions and discount coupons
          </p>
        </div>
        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={() => router.push(`/${lang}/apps/ecommerce/promotions/create`)}
        >
          Add Coupon
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className='text-red-600'>{error}</p>
      ) : coupons.length === 0 ? (
        <Card>
          <CardContent>
            <p>No coupons found. Click "Add Coupon" to create one.</p>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Usage</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coupons.map((coupon) => {
                const isExpired = coupon.date_expires && new Date(coupon.date_expires) < new Date()
                const usagePercent = coupon.usage_limit 
                  ? (coupon.usage_count / coupon.usage_limit) * 100 
                  : 0

                return (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <LocalOffer fontSize='small' color='primary' />
                        <strong>{coupon.code}</strong>
                        <IconButton size='small' onClick={() => copyCode(coupon.code)}>
                          <ContentCopy fontSize='small' />
                        </IconButton>
                      </div>
                      {coupon.description && (
                        <p className='text-xs text-gray-500 mt-1'>{coupon.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={coupon.discount_type.replace('_', ' ')}
                        size='small'
                        variant='outlined'
                      />
                    </TableCell>
                    <TableCell>
                      <strong>{getDiscountDisplay(coupon)}</strong>
                    </TableCell>
                    <TableCell>
                      {coupon.usage_limit ? (
                        <div>
                          <div className='text-sm'>
                            {coupon.usage_count || 0} / {coupon.usage_limit}
                          </div>
                          <div className='w-full bg-gray-200 rounded-full h-1.5 mt-1'>
                            <div
                              className='bg-blue-600 h-1.5 rounded-full'
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className='text-sm text-gray-500'>
                          {coupon.usage_count || 0} uses
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(coupon.date_expires)}</TableCell>
                    <TableCell>
                      {isExpired ? (
                        <Chip label='Expired' color='error' size='small' />
                      ) : (
                        <Chip label='Active' color='success' size='small' />
                      )}
                    </TableCell>
                    <TableCell align='right'>
                      <IconButton
                        size='small'
                        onClick={() => router.push(`/${lang}/apps/ecommerce/promotions/create?id=${coupon.id}`)}
                      >
                        <Edit fontSize='small' />
                      </IconButton>
                      <IconButton
                        size='small'
                        onClick={() => setDeleteDialog({ open: true, coupon })}
                      >
                        <Delete fontSize='small' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, coupon: null })}>
        <DialogTitle>Delete Coupon</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the coupon "{deleteDialog.coupon?.code}"? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, coupon: null })}>Cancel</Button>
          <Button onClick={handleDelete} color='error' variant='contained'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
