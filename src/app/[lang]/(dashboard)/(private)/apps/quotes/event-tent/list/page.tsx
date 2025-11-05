'use client'

import { useState, useEffect } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  Box,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EditIcon from '@mui/icons-material/Edit'
import DescriptionIcon from '@mui/icons-material/Description'
import Snackbar from '@mui/material/Snackbar'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'

// Custom Select Icon Component to fix hydration error
const SelectIcon = () => <i className='tabler-chevron-down' />

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Quote {
  id: string
  quoteNumber: string
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  eventType: string
  eventStartDate: string | null
  eventEndDate: string | null
  eventVenue: string | null
  numberOfGuests: number
  duration: number
  tentType: string
  structureSummary: string | null
  lineItems: string
  subtotal: number
  vat: number
  total: number
  status: string
  createdAt: string
  updatedAt: string
}

export default function QuotesListPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Accept quote state
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)
  const [acceptSuccess, setAcceptSuccess] = useState<string | null>(null)

  // View quote state
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewQuote, setViewQuote] = useState<Quote | null>(null)

  // BOQ generation state
  const [generatingBOQ, setGeneratingBOQ] = useState<string | null>(null)

  const [boqSnackbar, setBOQSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/quotes/event-tent/list', window.location.origin)

      if (statusFilter !== 'all') {
        url.searchParams.set('status', statusFilter)
      }

      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.success) {
        setQuotes(data.quotes)
      }
    } catch (error) {
      console.error('Error fetching quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotes()
  }, [statusFilter])

  const generateBOQ = async (quote: Quote) => {
    try {
      setGeneratingBOQ(quote.id)

      const response = await fetch('/api/boq/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quoteId: quote.id })
      })

      const data = await response.json()

      if (data.success) {
        setBOQSnackbar({
          open: true,
          message: `BOQ ${data.boq.boqNumber} generated successfully!`,
          severity: 'success'
        })

        // Navigate to BOQ view page after a short delay
        setTimeout(() => {
          router.push(`/en/apps/boq/view/${data.boq.id}`)
        }, 1500)
      } else {
        setBOQSnackbar({
          open: true,
          message: data.error || 'Failed to generate BOQ',
          severity: 'error'
        })
      }
    } catch (error) {
      console.error('Error generating BOQ:', error)
      setBOQSnackbar({
        open: true,
        message: 'Error generating BOQ. Please try again.',
        severity: 'error'
      })
    } finally {
      setGeneratingBOQ(null)
    }
  }

  const deleteQuote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return

    try {
      const response = await fetch(`/api/quotes/event-tent/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        fetchQuotes()
      }
    } catch (error) {
      console.error('Error deleting quote:', error)
    }
  }

  const openAcceptDialog = (quote: Quote) => {
    setSelectedQuote(quote)
    setAcceptDialogOpen(true)
    setAcceptError(null)
    setAcceptSuccess(null)
  }

  const closeAcceptDialog = () => {
    setAcceptDialogOpen(false)
    setSelectedQuote(null)
    setAcceptError(null)
    setAcceptSuccess(null)
  }

  const acceptQuote = async () => {
    if (!selectedQuote) return

    try {
      setAccepting(true)
      setAcceptError(null)

      const response = await fetch(`/api/quotes/event-tent/${selectedQuote.id}/accept`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to accept quote')
      }

      setAcceptSuccess(`Quote #${data.quote.quoteNumber} accepted successfully!`)

      // Refresh quotes list after 2 seconds
      setTimeout(() => {
        fetchQuotes()
        closeAcceptDialog()
      }, 2000)
    } catch (error: any) {
      console.error('Error accepting quote:', error)
      setAcceptError(error.message)
    } finally {
      setAccepting(false)
    }
  }

  const openViewDialog = (quote: Quote) => {
    setViewQuote(quote)
    setViewDialogOpen(true)
  }

  const closeViewDialog = () => {
    setViewDialogOpen(false)
    setViewQuote(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default'
      case 'sent':
        return 'info'
      case 'accepted':
        return 'success'
      case 'rejected':
        return 'error'
      case 'expired':
        return 'warning'
      default:
        return 'default'
    }
  }

  const filteredQuotes = quotes.filter(
    quote =>
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card>
      <CardHeader
        title={
          <Box display='flex' alignItems='center' gap={2}>
            <Typography variant='h5'>Event Tent Quotes</Typography>
            <Chip label={`${filteredQuotes.length} quotes`} color='primary' size='small' />
          </Box>
        }
        action={
          <Box display='flex' gap={1}>
            <Button component={Link} href='/en/apps/quotes/event-tent' variant='contained' startIcon={<AddIcon />}>
              New Quote
            </Button>
            <IconButton onClick={fetchQuotes} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        }
      />
      <CardContent>
        {/* Filters */}
        <Box display='flex' gap={2} mb={3}>
          <TextField
            placeholder='Search quotes...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 300 }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label='Status'
              onChange={e => setStatusFilter(e.target.value)}
              IconComponent={SelectIcon}
            >
              <MenuItem value='all'>All Statuses</MenuItem>
              <MenuItem value='draft'>Draft</MenuItem>
              <MenuItem value='sent'>Sent</MenuItem>
              <MenuItem value='accepted'>Accepted</MenuItem>
              <MenuItem value='rejected'>Rejected</MenuItem>
              <MenuItem value='expired'>Expired</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Table */}
        {loading ? (
          <Box display='flex' justifyContent='center' py={5}>
            <CircularProgress />
          </Box>
        ) : filteredQuotes.length === 0 ? (
          <Box textAlign='center' py={5}>
            <Typography variant='h6' color='text.secondary'>
              No quotes found
            </Typography>
            <Button component={Link} href='/en/apps/quotes/event-tent' variant='contained' sx={{ mt: 2 }}>
              Create Your First Quote
            </Button>
          </Box>
        ) : (
          <TableContainer component={Paper} variant='outlined'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Quote #</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Contact</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Event</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Structure</strong>
                  </TableCell>
                  <TableCell align='right'>
                    <strong>Total</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Created</strong>
                  </TableCell>
                  <TableCell align='center'>
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredQuotes.map(quote => (
                  <TableRow key={quote.id} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight='bold'>
                        {quote.quoteNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{quote.contactName || 'N/A'}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {quote.contactEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{quote.eventType}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {quote.numberOfGuests} guests • {quote.duration} day{quote.duration > 1 ? 's' : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' noWrap sx={{ maxWidth: 200 }}>
                        {quote.structureSummary || quote.tentType}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' fontWeight='bold'>
                        KSh {quote.total.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={quote.status} color={getStatusColor(quote.status)} size='small' />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{new Date(quote.createdAt).toLocaleDateString()}</Typography>
                    </TableCell>
                    <TableCell align='center'>
                      {(quote.status === 'draft' || quote.status === 'sent') && (
                        <IconButton
                          size='small'
                          color='success'
                          onClick={() => openAcceptDialog(quote)}
                          title='Accept Quote'
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
                      <IconButton
                        size='small'
                        color='secondary'
                        onClick={() => generateBOQ(quote)}
                        title='Generate BOQ'
                        disabled={generatingBOQ === quote.id}
                      >
                        {generatingBOQ === quote.id ? <CircularProgress size={20} /> : <DescriptionIcon />}
                      </IconButton>
                      <IconButton size='small' color='primary' onClick={() => openViewDialog(quote)} title='View Quote'>
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton size='small' color='error' onClick={() => deleteQuote(quote.id)} title='Delete'>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      {/* Accept Quote Dialog */}
      <Dialog open={acceptDialogOpen} onClose={closeAcceptDialog} maxWidth='sm' fullWidth>
        <DialogTitle>Accept Quote</DialogTitle>
        <DialogContent>
          {acceptError && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {acceptError}
            </Alert>
          )}
          {acceptSuccess && (
            <Alert severity='success' sx={{ mb: 2 }}>
              {acceptSuccess}
            </Alert>
          )}
          {selectedQuote && !acceptSuccess && (
            <Box>
              <Typography variant='body1' gutterBottom>
                Are you sure you want to accept this quote?
              </Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant='subtitle2' gutterBottom>
                  <strong>Quote Details:</strong>
                </Typography>
                <Typography variant='body2'>
                  <strong>Quote #:</strong> {selectedQuote.quoteNumber}
                </Typography>
                <Typography variant='body2'>
                  <strong>Customer:</strong> {selectedQuote.contactName || 'N/A'}
                </Typography>
                <Typography variant='body2'>
                  <strong>Email:</strong> {selectedQuote.contactEmail}
                </Typography>
                <Typography variant='body2'>
                  <strong>Event:</strong> {selectedQuote.eventType}
                </Typography>
                <Typography variant='body2'>
                  <strong>Guests:</strong> {selectedQuote.numberOfGuests}
                </Typography>
                <Typography variant='body2'>
                  <strong>Duration:</strong> {selectedQuote.duration} day{selectedQuote.duration > 1 ? 's' : ''}
                </Typography>
                <Typography variant='body2'>
                  <strong>Total:</strong> KSh {selectedQuote.total.toLocaleString()}
                </Typography>
              </Box>
              <Alert severity='info' sx={{ mt: 2 }}>
                This will update the quote status to &quot;Accepted&quot; in the database.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!acceptSuccess && (
            <>
              <Button onClick={closeAcceptDialog} disabled={accepting}>
                Cancel
              </Button>
              <Button
                variant='contained'
                color='success'
                onClick={acceptQuote}
                disabled={accepting}
                startIcon={accepting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              >
                {accepting ? 'Accepting...' : 'Accept Quote'}
              </Button>
            </>
          )}
          {acceptSuccess && (
            <Button variant='contained' onClick={closeAcceptDialog}>
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* View Quote Dialog */}
      <Dialog open={viewDialogOpen} onClose={closeViewDialog} maxWidth='md' fullWidth>
        <DialogTitle>Quote Details</DialogTitle>
        <DialogContent>
          {viewQuote && (
            <Box>
              {/* Quote Number */}
              <Box mb={3}>
                <Typography variant='h6' gutterBottom>
                  Quote #{viewQuote.quoteNumber}
                </Typography>
                <Chip label={viewQuote.status} color={getStatusColor(viewQuote.status)} size='small' />
              </Box>

              {/* Contact Information */}
              {(viewQuote.contactName || viewQuote.contactEmail || viewQuote.contactPhone) && (
                <Box mb={3}>
                  <Typography variant='subtitle2' gutterBottom>
                    <strong>Contact Information</strong>
                  </Typography>
                  {viewQuote.contactName && (
                    <Typography variant='body2'>
                      <strong>Name:</strong> {viewQuote.contactName}
                    </Typography>
                  )}
                  {viewQuote.contactEmail && (
                    <Typography variant='body2'>
                      <strong>Email:</strong> {viewQuote.contactEmail}
                    </Typography>
                  )}
                  {viewQuote.contactPhone && (
                    <Typography variant='body2'>
                      <strong>Phone:</strong> {viewQuote.contactPhone}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Event Details */}
              <Box mb={3}>
                <Typography variant='subtitle2' gutterBottom>
                  <strong>Event Details</strong>
                </Typography>
                <Typography variant='body2'>
                  <strong>Type:</strong> {viewQuote.eventType}
                </Typography>
                <Typography variant='body2'>
                  <strong>Number of Guests:</strong> {viewQuote.numberOfGuests}
                </Typography>
                <Typography variant='body2'>
                  <strong>Duration:</strong> {viewQuote.duration} day{viewQuote.duration > 1 ? 's' : ''}
                </Typography>
                {viewQuote.eventStartDate && (
                  <Typography variant='body2'>
                    <strong>Start Date:</strong> {new Date(viewQuote.eventStartDate).toLocaleDateString()}
                  </Typography>
                )}
                {viewQuote.eventEndDate && (
                  <Typography variant='body2'>
                    <strong>End Date:</strong> {new Date(viewQuote.eventEndDate).toLocaleDateString()}
                  </Typography>
                )}
                {viewQuote.eventVenue && (
                  <Typography variant='body2'>
                    <strong>Venue:</strong> {viewQuote.eventVenue}
                  </Typography>
                )}
              </Box>

              {/* Structure Details */}
              {viewQuote.structureSummary && (
                <Box mb={3}>
                  <Typography variant='subtitle2' gutterBottom>
                    <strong>Structure</strong>
                  </Typography>
                  <Typography variant='body2'>{viewQuote.structureSummary}</Typography>
                </Box>
              )}

              {/* Line Items */}
              <Box mb={3}>
                <Typography variant='subtitle2' gutterBottom>
                  <strong>Quote Items</strong>
                </Typography>
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Description</strong>
                        </TableCell>
                        <TableCell align='right'>
                          <strong>Qty</strong>
                        </TableCell>
                        <TableCell align='right'>
                          <strong>Unit Price</strong>
                        </TableCell>
                        <TableCell align='right'>
                          <strong>Total</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {JSON.parse(viewQuote.lineItems).map((item: LineItem, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell align='right'>{item.quantity}</TableCell>
                          <TableCell align='right'>KSh {item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell align='right'>KSh {item.totalPrice.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Pricing */}
              <Box mb={2} sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                <Typography variant='subtitle2' gutterBottom>
                  <strong>Pricing</strong>
                </Typography>
                <Box display='flex' justifyContent='space-between' mb={1}>
                  <Typography variant='body2'>Subtotal:</Typography>
                  <Typography variant='body2'>
                    <strong>KSh {viewQuote.subtotal.toLocaleString()}</strong>
                  </Typography>
                </Box>
                <Box display='flex' justifyContent='space-between' mb={1}>
                  <Typography variant='body2'>VAT (16%):</Typography>
                  <Typography variant='body2'>
                    <strong>KSh {viewQuote.vat.toLocaleString()}</strong>
                  </Typography>
                </Box>
                <Box
                  display='flex'
                  justifyContent='space-between'
                  pt={1}
                  sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                >
                  <Typography variant='h6'>Total:</Typography>
                  <Typography variant='h6' color='primary'>
                    <strong>KSh {viewQuote.total.toLocaleString()}</strong>
                  </Typography>
                </Box>
              </Box>

              {/* Timestamps */}
              <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                <Typography variant='caption' color='text.secondary' display='block'>
                  <strong>Created:</strong> {new Date(viewQuote.createdAt).toLocaleString()}
                </Typography>
                <Typography variant='caption' color='text.secondary' display='block'>
                  <strong>Last Updated:</strong> {new Date(viewQuote.updatedAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeViewDialog}>Close</Button>
          <Button
            variant='contained'
            startIcon={<EditIcon />}
            onClick={() => {
              closeViewDialog()
              router.push(`/en/apps/quotes/event-tent?edit=${viewQuote?.id}`)
            }}
          >
            Edit Quote
          </Button>
        </DialogActions>
      </Dialog>

      {/* BOQ Generation Snackbar */}
      <Snackbar
        open={boqSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setBOQSnackbar({ ...boqSnackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setBOQSnackbar({ ...boqSnackbar, open: false })}
          severity={boqSnackbar.severity}
          sx={{ width: '100%' }}
        >
          {boqSnackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  )
}
