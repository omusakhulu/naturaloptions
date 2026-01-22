'use client'

import { useState, useEffect, useMemo } from 'react'

import { useParams } from 'next/navigation'

// PDF Export

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import InputAdornment from '@mui/material/InputAdornment'

import { printAsPDF, downloadAsPDF } from '@/utils/pdfExport'

const BOQViewPage = () => {
  const params = useParams()
  const [boq, setBOQ] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editedBOQ, setEditedBOQ] = useState(null)
  const [editedSections, setEditedSections] = useState([])
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const boqId = params?.id

  useEffect(() => {
    if (boqId) {
      fetchBOQ()
    }
  }, [boqId])

  const fetchBOQ = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/boq/${boqId}`)
      const data = await response.json()

      if (data.success) {
        setBOQ(data.boq)
        setEditedBOQ(data.boq)
        const sections = typeof data.boq.sections === 'string' ? JSON.parse(data.boq.sections) : data.boq.sections || []

        setEditedSections(JSON.parse(JSON.stringify(sections))) // Deep copy
      }
    } catch (error) {
      console.error('Error fetching BOQ:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async () => {
    try {
      const element = document.getElementById('boq-content')

      await printAsPDF(element, `BOQ-${boq?.boqNumber || 'document'}.pdf`)
    } catch (error) {
      console.error('Error printing BOQ:', error)
      setSnackbar({ open: true, message: 'Error generating PDF', severity: 'error' })
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const element = document.getElementById('boq-content')

      await downloadAsPDF(element, `BOQ-${boq?.boqNumber || 'document'}.pdf`)
      setSnackbar({ open: true, message: 'PDF downloaded successfully!', severity: 'success' })
    } catch (error) {
      console.error('Error downloading PDF:', error)
      setSnackbar({ open: true, message: 'Error generating PDF', severity: 'error' })
    }
  }

  const handleEdit = () => {
    const sections = typeof boq.sections === 'string' ? JSON.parse(boq.sections) : boq.sections || []

    setEditedSections(JSON.parse(JSON.stringify(sections))) // Deep copy
    setEditedBOQ({ ...boq })
    setEditMode(true)
  }

  const handleCancelEdit = () => {
    const sections = typeof boq.sections === 'string' ? JSON.parse(boq.sections) : boq.sections || []

    setEditedSections(JSON.parse(JSON.stringify(sections)))
    setEditedBOQ({ ...boq })
    setEditMode(false)
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch(`/api/boq/${boqId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectName: editedBOQ.projectName,
          projectLocation: editedBOQ.projectLocation,
          clientName: editedBOQ.clientName,
          clientEmail: editedBOQ.clientEmail,
          clientPhone: editedBOQ.clientPhone,
          eventDate: editedBOQ.eventDate,
          duration: editedBOQ.duration,
          status: editedBOQ.status,
          remarks: editedBOQ.remarks,
          discount: calculatedTotals.discount.toString(),
          paymentTerms: editedBOQ.paymentTerms,
          validityDays: editedBOQ.validityDays || 30,
          sections: JSON.stringify(calculatedTotals.sections),
          subtotal: calculatedTotals.subtotal.toString(),
          vat: calculatedTotals.vat.toString(),
          total: calculatedTotals.total.toString(),
          internalCost: calculatedTotals.totalCost.toString(),
          profitAmount: calculatedTotals.profit.toString(),
          profitMargin: calculatedTotals.profitMargin.toFixed(2)
        })
      })

      const data = await response.json()

      if (data.success) {
        setBOQ(data.boq)
        const sections = typeof data.boq.sections === 'string' ? JSON.parse(data.boq.sections) : data.boq.sections || []

        setEditedSections(JSON.parse(JSON.stringify(sections)))
        setEditedBOQ(data.boq)
        setEditMode(false)
        setSnackbar({ open: true, message: 'BOQ updated successfully!', severity: 'success' })
      } else {
        setSnackbar({ open: true, message: data.error || 'Failed to update BOQ', severity: 'error' })
      }
    } catch (error) {
      console.error('Error updating BOQ:', error)
      setSnackbar({ open: true, message: 'Error updating BOQ', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field, value) => {
    setEditedBOQ({ ...editedBOQ, [field]: value })
  }

  // Auto-recalculate totals whenever sections change
  const calculatedTotals = useMemo(() => {
    if (!editedSections || editedSections.length === 0) {
      return {
        subtotal: 0,
        vat: 0,
        total: 0,
        totalCost: 0,
        profit: 0,
        profitMargin: 0
      }
    }

    // Recalculate each item's amounts
    const updatedSections = editedSections.map(section => ({
      ...section,
      items: section.items.map(item => ({
        ...item,
        amount: item.quantity * item.rate,
        costAmount: item.quantity * (item.cost || 0)
      })),
      subtotal: section.items.reduce((sum, item) => sum + item.quantity * item.rate, 0),
      costSubtotal: section.items.reduce((sum, item) => sum + item.quantity * (item.cost || 0), 0)
    }))

    const subtotal = updatedSections.reduce((sum, section) => sum + section.subtotal, 0)
    const discount = parseFloat(editedBOQ?.discount || 0)
    const discountedSubtotal = subtotal - discount
    const vat = discountedSubtotal * 0.16
    const total = discountedSubtotal + vat

    const totalCost = updatedSections.reduce((sum, section) => sum + section.costSubtotal, 0)
    const profit = total - totalCost
    const profitMargin = total > 0 ? (profit / total) * 100 : 0

    return {
      sections: updatedSections,
      subtotal,
      discount,
      discountedSubtotal,
      vat,
      total,
      totalCost,
      profit,
      profitMargin
    }
  }, [editedSections, editedBOQ?.discount])

  // Update line item field
  const updateItemField = (sectionIdx, itemIdx, field, value) => {
    const newSections = [...editedSections]
    const parsedValue = ['quantity', 'rate', 'cost'].includes(field) ? parseFloat(value) || 0 : value

    newSections[sectionIdx].items[itemIdx][field] = parsedValue
    setEditedSections(newSections)
  }

  // Add new item to section
  const addNewItem = sectionIdx => {
    const newSections = [...editedSections]
    const section = newSections[sectionIdx]
    const itemCounter = section.items.length + 1

    newSections[sectionIdx].items.push({
      itemNo: `${section.sectionNo}.${itemCounter}`,
      description: 'New Item',
      unit: 'No',
      quantity: 1,
      cost: 0,
      rate: 0,
      amount: 0,
      costAmount: 0,
      remarks: ''
    })
    setEditedSections(newSections)
  }

  // Remove item from section
  const removeItem = (sectionIdx, itemIdx) => {
    const newSections = [...editedSections]

    newSections[sectionIdx].items.splice(itemIdx, 1)

    // Renumber items
    newSections[sectionIdx].items.forEach((item, idx) => {
      item.itemNo = `${newSections[sectionIdx].sectionNo}.${idx + 1}`
    })

    setEditedSections(newSections)
  }

  // Get profit margin color
  const getProfitColor = margin => {
    if (margin < 10) return 'error'
    if (margin < 20) return 'warning'
    if (margin < 30) return 'info'

    return 'success'
  }

  const formatCurrency = value => {
    const num = parseFloat(value || 0)

    return `KES ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = dateString => {
    if (!dateString) return 'N/A'

    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = status => {
    const s = String(status || 'draft').toLowerCase()

    if (s === 'completed') return 'success'
    if (s === 'approved') return 'info'
    if (s === 'sent') return 'warning'

    return 'default'
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <CircularProgress />
      </div>
    )
  }

  if (!boq) {
    return (
      <Card>
        <CardContent>
          <Typography>BOQ not found</Typography>
        </CardContent>
      </Card>
    )
  }

  // Use calculated sections when in edit mode, otherwise use saved sections
  const sections = editMode
    ? calculatedTotals.sections
    : typeof boq.sections === 'string'
      ? JSON.parse(boq.sections)
      : boq.sections || []

  const totals = editMode
    ? calculatedTotals
    : {
        subtotal: parseFloat(boq.subtotal || 0),
        vat: parseFloat(boq.vat || 0),
        total: parseFloat(boq.total || 0),
        totalCost: parseFloat(boq.internalCost || 0),
        profit: parseFloat(boq.profitAmount || 0),
        profitMargin: parseFloat(boq.profitMargin || 0),
        discount: parseFloat(boq.discount || 0)
      }

  return (
    <div>
      {/* Print Controls (hidden on print) */}
      <div className='flex justify-end gap-2 mb-4 print:hidden'>
        <Button variant='outlined' startIcon={<i className='tabler-arrow-left' />} href='../list'>
          Back to List
        </Button>
        {!editMode ? (
          <>
            <Button variant='outlined' color='primary' startIcon={<i className='tabler-edit' />} onClick={handleEdit}>
              Edit BOQ
            </Button>
            <Button variant='outlined' startIcon={<i className='tabler-download' />} onClick={handleDownloadPDF}>
              Download PDF
            </Button>
            <Button variant='contained' startIcon={<i className='tabler-printer' />} onClick={handlePrint}>
              Print PDF
            </Button>
          </>
        ) : (
          <>
            <Button variant='outlined' onClick={handleCancelEdit} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant='contained'
              color='primary'
              startIcon={saving ? <CircularProgress size={20} /> : <i className='tabler-check' />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        )}
      </div>

      {/* Internal Cost Analysis (HIDDEN from print) */}
      {editMode && (
        <Paper
          sx={{ p: 3, mb: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}
          className='print:hidden'
        >
          <Typography variant='h6' sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className='tabler-chart-line' />
            Internal Cost Analysis
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box>
              <Typography variant='caption' color='text.secondary'>
                Total Selling Price
              </Typography>
              <Typography variant='h6' color='primary'>
                {formatCurrency(totals.total)}
              </Typography>
            </Box>
            <Box>
              <Typography variant='caption' color='text.secondary'>
                Total Internal Cost
              </Typography>
              <Typography variant='h6' color='text.primary'>
                {formatCurrency(totals.totalCost)}
              </Typography>
            </Box>
            <Box>
              <Typography variant='caption' color='text.secondary'>
                Gross Profit
              </Typography>
              <Typography variant='h6' color='success.main'>
                {formatCurrency(totals.profit)}
              </Typography>
            </Box>
            <Box>
              <Typography variant='caption' color='text.secondary'>
                Profit Margin
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant='h6' color={`${getProfitColor(totals.profitMargin)}.main`}>
                  {totals.profitMargin.toFixed(2)}%
                </Typography>
                <Chip
                  label={
                    totals.profitMargin < 10
                      ? 'Low'
                      : totals.profitMargin < 20
                        ? 'Fair'
                        : totals.profitMargin < 30
                          ? 'Good'
                          : 'Excellent'
                  }
                  color={getProfitColor(totals.profitMargin)}
                  size='small'
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      {/* BOQ Document */}
      <Card id='boq-content' className='boq-document'>
        <CardContent className='p-8'>
          {/* Header */}
          <div className='text-center mb-8'>
            <Typography variant='h3' className='font-bold mb-2'>
              BILL OF QUANTITIES
            </Typography>
            <Typography variant='h6' color='text.secondary'>
              OmniSpace3D Events & Exhibitions
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Professional Event Infrastructure Solutions
            </Typography>
          </div>

          <Divider className='mb-6' />

          {/* BOQ Information */}
          <div className='grid grid-cols-2 gap-6 mb-6'>
            <div>
              <Typography variant='subtitle2' color='text.secondary' className='mb-2'>
                BOQ Number
              </Typography>
              <Typography variant='h6' className='font-bold'>
                {boq.boqNumber}
              </Typography>
            </div>
            <div className='text-right'>
              <Typography variant='subtitle2' color='text.secondary' className='mb-2'>
                Date
              </Typography>
              <Typography variant='body1'>{formatDate(boq.createdAt)}</Typography>
            </div>
          </div>

          {/* Project Details */}
          <Box sx={{ bgcolor: 'action.hover', p: 4, borderRadius: 2, mb: 3 }}>
            <Typography variant='h6' sx={{ mb: 3, fontWeight: 600 }}>
              Project Information
            </Typography>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Typography variant='caption' sx={{ fontWeight: 500, color: 'text.secondary' }}>
                  Project Name
                </Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    size='small'
                    value={editedBOQ.projectName}
                    onChange={e => updateField('projectName', e.target.value)}
                    sx={{ mt: 0.5 }}
                  />
                ) : (
                  <Typography variant='body1' sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {boq.projectName}
                  </Typography>
                )}
              </div>
              <div>
                <Typography variant='caption' sx={{ fontWeight: 500, color: 'text.secondary' }}>
                  Location
                </Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    size='small'
                    value={editedBOQ.projectLocation || ''}
                    onChange={e => updateField('projectLocation', e.target.value)}
                    sx={{ mt: 0.5 }}
                  />
                ) : (
                  <Typography variant='body1' sx={{ color: 'text.primary' }}>
                    {boq.projectLocation || 'N/A'}
                  </Typography>
                )}
              </div>
              <div>
                <Typography variant='caption' sx={{ fontWeight: 500, color: 'text.secondary' }}>
                  Client Name
                </Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    size='small'
                    value={editedBOQ.clientName}
                    onChange={e => updateField('clientName', e.target.value)}
                    sx={{ mt: 0.5 }}
                  />
                ) : (
                  <Typography variant='body1' sx={{ color: 'text.primary' }}>
                    {boq.clientName}
                  </Typography>
                )}
              </div>
              <div>
                <Typography variant='caption' sx={{ fontWeight: 500, color: 'text.secondary' }}>
                  Client Email
                </Typography>
                {editMode ? (
                  <TextField
                    fullWidth
                    size='small'
                    type='email'
                    value={editedBOQ.clientEmail || ''}
                    onChange={e => updateField('clientEmail', e.target.value)}
                    sx={{ mt: 0.5 }}
                  />
                ) : (
                  <Typography variant='body1' sx={{ color: 'text.primary' }}>
                    {boq.clientEmail || 'N/A'}
                  </Typography>
                )}
              </div>
              {boq.eventDate && (
                <div>
                  <Typography variant='caption' sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    Event Date
                  </Typography>
                  <Typography variant='body1' sx={{ color: 'text.primary' }}>
                    {formatDate(boq.eventDate)}
                  </Typography>
                </div>
              )}
              {boq.duration && (
                <div>
                  <Typography variant='caption' sx={{ fontWeight: 500, color: 'text.secondary' }}>
                    Duration
                  </Typography>
                  <Typography variant='body1' sx={{ color: 'text.primary' }}>
                    {boq.duration} day(s)
                  </Typography>
                </div>
              )}
              <div>
                <Typography variant='caption' sx={{ fontWeight: 500, color: 'text.secondary' }}>
                  Status
                </Typography>
                <div className='mt-1'>
                  {editMode ? (
                    <FormControl fullWidth size='small'>
                      <Select value={editedBOQ.status} onChange={e => updateField('status', e.target.value)}>
                        <MenuItem value='draft'>Draft</MenuItem>
                        <MenuItem value='approved'>Approved</MenuItem>
                        <MenuItem value='sent'>Sent</MenuItem>
                        <MenuItem value='completed'>Completed</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip
                      label={boq.status?.toUpperCase()}
                      size='small'
                      color={getStatusColor(boq.status)}
                      variant='filled'
                    />
                  )}
                </div>
              </div>
            </div>
          </Box>

          {/* BOQ Sections */}
          <div className='mb-6'>
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx} className='mb-8'>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant='h6' sx={{ fontWeight: 700 }}>
                    {section.sectionNo}. {section.sectionTitle}
                  </Typography>
                  {editMode && (
                    <Button
                      size='small'
                      startIcon={<i className='tabler-plus' />}
                      onClick={() => addNewItem(sectionIdx)}
                      variant='outlined'
                    >
                      Add Item
                    </Button>
                  )}
                </Box>

                <Table size='small' sx={{ border: 1, borderColor: 'divider' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell width='8%' sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Item No.
                      </TableCell>
                      <TableCell width={editMode ? '28%' : '40%'} sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Description
                      </TableCell>
                      <TableCell width='8%' align='center' sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Unit
                      </TableCell>
                      <TableCell width='10%' align='center' sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Quantity
                      </TableCell>
                      {editMode && (
                        <TableCell
                          width='12%'
                          align='right'
                          sx={{ fontWeight: 600, color: 'text.primary' }}
                          className='print:hidden'
                        >
                          Cost (KES)
                        </TableCell>
                      )}
                      <TableCell width='12%' align='right' sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Rate (KES)
                      </TableCell>
                      <TableCell width='13%' align='right' sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Amount (KES)
                      </TableCell>
                      {editMode && <TableCell width='5%' className='print:hidden'></TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {section.items.map((item, itemIdx) => (
                      <TableRow key={itemIdx}>
                        <TableCell sx={{ fontWeight: 500, color: 'text.primary' }}>{item.itemNo}</TableCell>
                        <TableCell>
                          {editMode ? (
                            <TextField
                              fullWidth
                              size='small'
                              value={item.description}
                              onChange={e => updateItemField(sectionIdx, itemIdx, 'description', e.target.value)}
                            />
                          ) : (
                            <>
                              <Typography variant='body2' sx={{ color: 'text.primary' }}>
                                {item.description}
                              </Typography>
                              {item.remarks && (
                                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                                  {item.remarks}
                                </Typography>
                              )}
                            </>
                          )}
                        </TableCell>
                        <TableCell align='center'>
                          {editMode ? (
                            <TextField
                              size='small'
                              value={item.unit}
                              onChange={e => updateItemField(sectionIdx, itemIdx, 'unit', e.target.value)}
                              sx={{ width: 70 }}
                            />
                          ) : (
                            <Typography variant='body2' sx={{ color: 'text.primary' }}>
                              {item.unit}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align='center'>
                          {editMode ? (
                            <TextField
                              type='number'
                              size='small'
                              value={item.quantity}
                              onChange={e => updateItemField(sectionIdx, itemIdx, 'quantity', e.target.value)}
                              sx={{ width: 90 }}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          ) : (
                            <Typography variant='body2' sx={{ color: 'text.primary' }}>
                              {item.quantity}
                            </Typography>
                          )}
                        </TableCell>
                        {editMode && (
                          <TableCell align='right' className='print:hidden'>
                            <TextField
                              type='number'
                              size='small'
                              value={item.cost || 0}
                              onChange={e => updateItemField(sectionIdx, itemIdx, 'cost', e.target.value)}
                              sx={{ width: 110 }}
                              inputProps={{ min: 0, step: 0.01 }}
                              InputProps={{
                                startAdornment: <InputAdornment position='start'>KES</InputAdornment>
                              }}
                            />
                          </TableCell>
                        )}
                        <TableCell align='right'>
                          {editMode ? (
                            <TextField
                              type='number'
                              size='small'
                              value={item.rate}
                              onChange={e => updateItemField(sectionIdx, itemIdx, 'rate', e.target.value)}
                              sx={{ width: 110 }}
                              inputProps={{ min: 0, step: 0.01 }}
                              InputProps={{
                                startAdornment: <InputAdornment position='start'>KES</InputAdornment>
                              }}
                            />
                          ) : (
                            <Typography variant='body2' sx={{ color: 'text.primary' }}>
                              {item.rate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align='right' sx={{ fontWeight: 500, color: 'text.primary' }}>
                          {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        {editMode && (
                          <TableCell className='print:hidden'>
                            <Tooltip title='Remove item'>
                              <IconButton size='small' color='error' onClick={() => removeItem(sectionIdx, itemIdx)}>
                                <i className='tabler-trash' />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'action.selected', '&:hover': { bgcolor: 'action.selected' } }}>
                      <TableCell
                        colSpan={editMode ? 6 : 5}
                        align='right'
                        sx={{ fontWeight: 700, color: 'text.primary' }}
                      >
                        Section {section.sectionNo} Subtotal:
                      </TableCell>
                      <TableCell align='right' sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {section.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      {editMode && <TableCell className='print:hidden'></TableCell>}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>

          {/* Summary Totals */}
          <Box sx={{ borderTop: 2, borderColor: 'divider', pt: 4 }}>
            <div className='flex justify-end'>
              <div className='w-1/2'>
                <Table size='small'>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ border: 0, fontWeight: 600, fontSize: '1.125rem', color: 'text.primary' }}>
                        Subtotal:
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ border: 0, fontWeight: 600, fontSize: '1.125rem', color: 'text.primary' }}
                      >
                        {formatCurrency(totals.subtotal)}
                      </TableCell>
                    </TableRow>
                    {(editMode || totals.discount > 0) && (
                      <TableRow>
                        <TableCell sx={{ border: 0, color: 'text.primary' }}>Discount:</TableCell>
                        <TableCell align='right' sx={{ border: 0 }}>
                          {editMode ? (
                            <TextField
                              type='number'
                              size='small'
                              value={editedBOQ.discount || 0}
                              onChange={e => updateField('discount', e.target.value)}
                              sx={{ width: 130 }}
                              inputProps={{ min: 0, step: 0.01 }}
                              InputProps={{
                                startAdornment: <InputAdornment position='start'>KES</InputAdornment>
                              }}
                            />
                          ) : (
                            <Typography sx={{ color: 'error.main', fontWeight: 500 }}>
                              - {formatCurrency(totals.discount)}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell sx={{ border: 0, color: 'text.primary' }}>VAT (16%):</TableCell>
                      <TableCell align='right' sx={{ border: 0, color: 'text.primary' }}>
                        {formatCurrency(totals.vat)}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: 'primary.light' }}>
                      <TableCell
                        sx={{ border: 0, fontWeight: 700, fontSize: '1.25rem', color: 'primary.contrastText' }}
                      >
                        GRAND TOTAL:
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ border: 0, fontWeight: 700, fontSize: '1.25rem', color: 'primary.contrastText' }}
                      >
                        {formatCurrency(totals.total)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </Box>

          {/* Remarks */}
          <Box sx={{ mt: 3, p: 3, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
              Remarks:
            </Typography>
            {editMode ? (
              <TextField
                fullWidth
                multiline
                rows={3}
                value={editedBOQ.remarks || ''}
                onChange={e => updateField('remarks', e.target.value)}
                placeholder='Add remarks or special instructions...'
              />
            ) : (
              <Typography variant='body2' sx={{ color: 'text.primary' }}>
                {boq.remarks || 'No remarks'}
              </Typography>
            )}
          </Box>

          {/* Signature Section */}
          <div className='grid grid-cols-2 gap-8 mt-12 pt-8 border-t'>
            <div>
              <Typography variant='subtitle2' className='mb-8'>
                Client Signature
              </Typography>
              <div className='border-t border-gray-400 pt-2'>
                <Typography variant='caption' color='text.secondary'>
                  Name & Date
                </Typography>
              </div>
            </div>
            <div>
              <Typography variant='subtitle2' className='mb-8'>
                OmniSpace3D Representative
              </Typography>
              <div className='border-t border-gray-400 pt-2'>
                <Typography variant='caption' color='text.secondary'>
                  Name & Date
                </Typography>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className='mt-8 pt-4 border-t text-center'>
            <Typography variant='caption' color='text.secondary'>
              This Bill of Quantities is valid for 30 days from the date of issue
            </Typography>
          </div>
        </CardContent>
      </Card>

      {/* Success/Error Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .boq-document {
            box-shadow: none;
            border: none;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  )
}

export default BOQViewPage
