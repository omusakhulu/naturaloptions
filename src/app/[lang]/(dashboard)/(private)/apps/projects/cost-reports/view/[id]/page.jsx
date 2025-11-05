'use client'

import { useState, useEffect } from 'react'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// PDF Export

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import LinearProgress from '@mui/material/LinearProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import InputAdornment from '@mui/material/InputAdornment'

import { printAsPDF, downloadAsPDF } from '@/utils/pdfExport'

const statusColors = {
  draft: 'default',
  in_progress: 'info',
  completed: 'success'
}

const CostReportViewPage = () => {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const reportId = params?.id
  const editModeParam = searchParams?.get('edit')

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(editModeParam === 'true')
  const [saving, setSaving] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // Editable fields
  const [actualCosts, setActualCosts] = useState({
    labor: 0,
    transport: 0,
    material: 0,
    equipment: 0,
    overhead: 0,
    other: 0
  })

  const [status, setStatus] = useState('draft')
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    if (reportId) {
      fetchReport()
    }
  }, [reportId])

  const fetchReport = async (skipLoading = false) => {
    try {
      if (!skipLoading) {
        setLoading(true)
      }

      // Add cache buster to force fresh data
      const response = await fetch(`/api/projects/cost-reports/${reportId}?t=${Date.now()}`, {
        cache: 'no-store'
      })

      const data = await response.json()

      if (data.success) {
        setReport(data.costReport)
        setStatus(data.costReport.status)
        setRemarks(data.costReport.remarks || '')

        // Set actual costs from report
        setActualCosts({
          labor: data.costReport.laborCosts?.actual || 0,
          transport: data.costReport.transportCosts?.actual || 0,
          material: data.costReport.materialCosts?.actual || 0,
          equipment: data.costReport.equipmentCosts?.actual || 0,
          overhead: data.costReport.overheadCosts?.actual || 0,
          other: data.costReport.otherCosts?.actual || 0
        })
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      if (!skipLoading) {
        setLoading(false)
      }
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch(`/api/projects/cost-reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          remarks,
          actualLaborCost: actualCosts.labor.toString(),
          actualTransportCost: actualCosts.transport.toString(),
          actualMaterialCost: actualCosts.material.toString(),
          actualEquipmentCost: actualCosts.equipment.toString(),
          actualOverheadCost: actualCosts.overhead.toString(),
          actualOtherCost: actualCosts.other.toString(),
          estimatedCost: report.estimatedCost,
          revenue: report.revenue
        })
      })

      const data = await response.json()

      if (data.success) {
        setSnackbar({ open: true, message: 'Cost report updated successfully!', severity: 'success' })
        setEditMode(false)
        setTimeout(() => fetchReport(), 1000)
      } else {
        setSnackbar({ open: true, message: 'Failed to update report', severity: 'error' })
      }
    } catch (error) {
      console.error('Error updating report:', error)
      setSnackbar({ open: true, message: 'Error updating report', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleRecalculate = async () => {
    if (
      !window.confirm('Recalculate this cost report with updated project data? This will refresh all estimated costs.')
    ) {
      return
    }

    try {
      setRecalculating(true)

      const response = await fetch(`/api/projects/cost-reports/${reportId}/recalculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (data.success) {
        // Immediately update the report state with the returned data (already parsed by API)
        setReport(data.costReport)
        setStatus(data.costReport.status)
        setRemarks(data.costReport.remarks || '')

        // Set actual costs from parsed data
        setActualCosts({
          labor: data.costReport.laborCosts?.actual || 0,
          transport: data.costReport.transportCosts?.actual || 0,
          material: data.costReport.materialCosts?.actual || 0,
          equipment: data.costReport.equipmentCosts?.actual || 0,
          overhead: data.costReport.overheadCosts?.actual || 0,
          other: data.costReport.otherCosts?.actual || 0
        })

        setSnackbar({
          open: true,
          message: 'Cost report recalculated successfully! All costs have been updated.',
          severity: 'success'
        })
      } else {
        setSnackbar({
          open: true,
          message: data.error || 'Failed to recalculate report',
          severity: 'error'
        })
      }
    } catch (error) {
      console.error('Error recalculating report:', error)
      setSnackbar({
        open: true,
        message: 'Error recalculating report',
        severity: 'error'
      })
    } finally {
      setRecalculating(false)
    }
  }

  const handlePrintPDF = async () => {
    try {
      const element = document.getElementById('cost-report-content')

      await printAsPDF(element, `${report.reportNumber}-${report.projectName}.pdf`)
    } catch (error) {
      console.error('Error printing report:', error)
      setSnackbar({ open: true, message: 'Error generating PDF', severity: 'error' })
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const element = document.getElementById('cost-report-content')

      await downloadAsPDF(element, `${report.reportNumber}-${report.projectName}.pdf`)
      setSnackbar({ open: true, message: 'PDF downloaded successfully!', severity: 'success' })
    } catch (error) {
      console.error('Error downloading PDF:', error)
      setSnackbar({ open: true, message: 'Error generating PDF', severity: 'error' })
    }
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

  const getProfitColor = margin => {
    if (margin < 10) return 'error'
    if (margin < 20) return 'warning'
    if (margin < 30) return 'info'

    return 'success'
  }

  const getVarianceColor = variance => {
    const val = parseFloat(variance)

    if (val < 0) return 'success' // Under budget
    if (val > 0) return 'error' // Over budget

    return 'default'
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <CircularProgress />
      </div>
    )
  }

  if (!report) {
    return (
      <Card>
        <CardContent>
          <Typography>Cost report not found</Typography>
        </CardContent>
      </Card>
    )
  }

  const variance = parseFloat(report.variance)
  const variancePercent = parseFloat(report.variancePercent)
  const profitMargin = parseFloat(report.profitMargin)
  const totalActual = parseFloat(report.actualCost)
  const totalEstimated = parseFloat(report.estimatedCost)

  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid size={12}>
        <div className='flex justify-between items-center mb-2'>
          <div>
            <Typography variant='h4'>{report.reportNumber}</Typography>
            <Typography color='text.secondary' className='mt-1'>
              {report.projectName}
            </Typography>
          </div>
          <div className='flex gap-2'>
            <Button variant='outlined' component={Link} href='/apps/projects/cost-reports/list'>
              Back to List
            </Button>
            {!editMode ? (
              <>
                <Button
                  variant='outlined'
                  color='secondary'
                  startIcon={recalculating ? <CircularProgress size={20} /> : <i className='tabler-refresh' />}
                  onClick={handleRecalculate}
                  disabled={recalculating}
                >
                  {recalculating ? 'Recalculating...' : 'Recalculate'}
                </Button>
                <Button
                  variant='outlined'
                  color='primary'
                  startIcon={<i className='tabler-edit' />}
                  onClick={() => setEditMode(true)}
                  disabled={recalculating}
                >
                  Edit Report
                </Button>
                <Button
                  variant='outlined'
                  startIcon={<i className='tabler-download' />}
                  onClick={handleDownloadPDF}
                  disabled={recalculating}
                >
                  Download PDF
                </Button>
                <Button
                  variant='contained'
                  startIcon={<i className='tabler-printer' />}
                  onClick={handlePrintPDF}
                  disabled={recalculating}
                >
                  Print PDF
                </Button>
              </>
            ) : (
              <>
                <Button variant='outlined' onClick={() => setEditMode(false)} disabled={saving}>
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
        </div>
        <div className='flex gap-2 items-center'>
          <Chip label={report.status} color={statusColors[report.status]} size='small' />
          <Typography variant='caption' color='text.secondary'>
            Created: {formatDate(report.createdAt)}
          </Typography>
        </div>
      </Grid>

      {/* Printable Content */}
      <div id='cost-report-content' style={{ width: '100%' }}>
        {/* Summary Cards */}
        <Grid size={12}>
          <Grid container spacing={4}>
            <Grid size={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant='caption' color='text.secondary'>
                    Revenue
                  </Typography>
                  <Typography variant='h5' color='primary.main' className='mt-1'>
                    {formatCurrency(report.revenue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant='caption' color='text.secondary'>
                    Total Cost (Actual)
                  </Typography>
                  <Typography variant='h5' className='mt-1'>
                    {formatCurrency(totalActual)}
                  </Typography>
                  <LinearProgress
                    variant='determinate'
                    value={Math.min((totalActual / parseFloat(report.revenue)) * 100, 100)}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant='caption' color='text.secondary'>
                    Profit
                  </Typography>
                  <Typography variant='h5' color='success.main' className='mt-1'>
                    {formatCurrency(report.profit)}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Margin: {profitMargin.toFixed(2)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant='caption' color='text.secondary'>
                    Budget Variance
                  </Typography>
                  <Typography variant='h5' color={variance < 0 ? 'success.main' : 'error.main'} className='mt-1'>
                    {variance < 0 ? '-' : '+'}
                    {formatCurrency(Math.abs(variance))}
                  </Typography>
                  <Chip
                    label={variance < 0 ? 'Under Budget' : variance > 0 ? 'Over Budget' : 'On Budget'}
                    color={getVarianceColor(variance)}
                    size='small'
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Profit Margin Visualization */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant='h6' className='mb-4'>
                Profit Margin Analysis
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant='determinate'
                    value={Math.min(profitMargin, 100)}
                    size={120}
                    thickness={5}
                    color={getProfitColor(profitMargin)}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column'
                    }}
                  >
                    <Typography variant='h4' color={`${getProfitColor(profitMargin)}.main`}>
                      {profitMargin.toFixed(1)}%
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Margin
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='body2' color='text.secondary' className='mb-2'>
                    Performance Rating
                  </Typography>
                  <Chip
                    label={
                      profitMargin > 30 ? 'Excellent' : profitMargin > 20 ? 'Good' : profitMargin > 10 ? 'Fair' : 'Low'
                    }
                    color={getProfitColor(profitMargin)}
                    sx={{ fontSize: '1rem', p: 2 }}
                  />
                  <Typography variant='caption' color='text.secondary' className='mt-2' display='block'>
                    {profitMargin > 30
                      ? 'Outstanding profitability! Project exceeds expectations.'
                      : profitMargin > 20
                        ? 'Healthy profit margin. Project is performing well.'
                        : profitMargin > 10
                          ? 'Acceptable margin. Room for optimization.'
                          : 'Low margin. Review costs and pricing strategy.'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Breakdown Table */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant='h6' className='mb-4'>
                Cost Breakdown Analysis
              </Typography>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600 }}>
                      Estimated
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600 }}>
                      Actual
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 600 }}>
                      Variance
                    </TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600 }}>
                      %
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Labor Costs */}
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <i className='tabler-users' />
                        <Typography>Labor & Crew</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align='right'>{formatCurrency(report.laborCosts?.estimated || 0)}</TableCell>
                    <TableCell align='right'>
                      {editMode ? (
                        <TextField
                          type='number'
                          size='small'
                          value={actualCosts.labor}
                          onChange={e => setActualCosts({ ...actualCosts, labor: parseFloat(e.target.value) || 0 })}
                          InputProps={{
                            startAdornment: <InputAdornment position='start'>KES</InputAdornment>
                          }}
                          sx={{ width: 150 }}
                        />
                      ) : (
                        formatCurrency(report.laborCosts?.actual || 0)
                      )}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        color: (report.laborCosts?.variance || 0) < 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatCurrency(Math.abs(report.laborCosts?.variance || 0))}
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={
                          report.laborCosts?.estimated > 0
                            ? `${(((report.laborCosts?.variance || 0) / report.laborCosts?.estimated) * 100).toFixed(1)}%`
                            : '0%'
                        }
                        color={getVarianceColor(report.laborCosts?.variance || 0)}
                        size='small'
                      />
                    </TableCell>
                  </TableRow>

                  {/* Transportation */}
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <i className='tabler-truck' />
                        <Typography>Transportation</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align='right'>{formatCurrency(report.transportCosts?.estimated || 0)}</TableCell>
                    <TableCell align='right'>
                      {editMode ? (
                        <TextField
                          type='number'
                          size='small'
                          value={actualCosts.transport}
                          onChange={e => setActualCosts({ ...actualCosts, transport: parseFloat(e.target.value) || 0 })}
                          InputProps={{
                            startAdornment: <InputAdornment position='start'>KES</InputAdornment>
                          }}
                          sx={{ width: 150 }}
                        />
                      ) : (
                        formatCurrency(report.transportCosts?.actual || 0)
                      )}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        color: (report.transportCosts?.variance || 0) < 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatCurrency(Math.abs(report.transportCosts?.variance || 0))}
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={
                          report.transportCosts?.estimated > 0
                            ? `${(((report.transportCosts?.variance || 0) / report.transportCosts?.estimated) * 100).toFixed(1)}%`
                            : '0%'
                        }
                        color={getVarianceColor(report.transportCosts?.variance || 0)}
                        size='small'
                      />
                    </TableCell>
                  </TableRow>

                  {/* Materials */}
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <i className='tabler-box' />
                        <Typography>Materials</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align='right'>{formatCurrency(report.materialCosts?.estimated || 0)}</TableCell>
                    <TableCell align='right'>
                      {editMode ? (
                        <TextField
                          type='number'
                          size='small'
                          value={actualCosts.material}
                          onChange={e => setActualCosts({ ...actualCosts, material: parseFloat(e.target.value) || 0 })}
                          InputProps={{
                            startAdornment: <InputAdornment position='start'>KES</InputAdornment>
                          }}
                          sx={{ width: 150 }}
                        />
                      ) : (
                        formatCurrency(report.materialCosts?.actual || 0)
                      )}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        color: (report.materialCosts?.variance || 0) < 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatCurrency(Math.abs(report.materialCosts?.variance || 0))}
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={
                          report.materialCosts?.estimated > 0
                            ? `${(((report.materialCosts?.variance || 0) / report.materialCosts?.estimated) * 100).toFixed(1)}%`
                            : 'N/A'
                        }
                        color={getVarianceColor(report.materialCosts?.variance || 0)}
                        size='small'
                      />
                    </TableCell>
                  </TableRow>

                  {/* Equipment */}
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <i className='tabler-tool' />
                        <Typography>Equipment</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align='right'>{formatCurrency(report.equipmentCosts?.estimated || 0)}</TableCell>
                    <TableCell align='right'>
                      {editMode ? (
                        <TextField
                          type='number'
                          size='small'
                          value={actualCosts.equipment}
                          onChange={e => setActualCosts({ ...actualCosts, equipment: parseFloat(e.target.value) || 0 })}
                          InputProps={{
                            startAdornment: <InputAdornment position='start'>KES</InputAdornment>
                          }}
                          sx={{ width: 150 }}
                        />
                      ) : (
                        formatCurrency(report.equipmentCosts?.actual || 0)
                      )}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        color: (report.equipmentCosts?.variance || 0) < 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatCurrency(Math.abs(report.equipmentCosts?.variance || 0))}
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={
                          report.equipmentCosts?.estimated > 0
                            ? `${(((report.equipmentCosts?.variance || 0) / report.equipmentCosts?.estimated) * 100).toFixed(1)}%`
                            : 'N/A'
                        }
                        color={getVarianceColor(report.equipmentCosts?.variance || 0)}
                        size='small'
                      />
                    </TableCell>
                  </TableRow>

                  {/* Overhead */}
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <i className='tabler-building' />
                        <Typography>Overhead</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align='right'>{formatCurrency(report.overheadCosts?.estimated || 0)}</TableCell>
                    <TableCell align='right'>
                      {editMode ? (
                        <TextField
                          type='number'
                          size='small'
                          value={actualCosts.overhead}
                          onChange={e => setActualCosts({ ...actualCosts, overhead: parseFloat(e.target.value) || 0 })}
                          InputProps={{
                            startAdornment: <InputAdornment position='start'>KES</InputAdornment>
                          }}
                          sx={{ width: 150 }}
                        />
                      ) : (
                        formatCurrency(report.overheadCosts?.actual || 0)
                      )}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        color: (report.overheadCosts?.variance || 0) < 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatCurrency(Math.abs(report.overheadCosts?.variance || 0))}
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={
                          report.overheadCosts?.estimated > 0
                            ? `${(((report.overheadCosts?.variance || 0) / report.overheadCosts?.estimated) * 100).toFixed(1)}%`
                            : 'N/A'
                        }
                        color={getVarianceColor(report.overheadCosts?.variance || 0)}
                        size='small'
                      />
                    </TableCell>
                  </TableRow>

                  {/* Other */}
                  <TableRow>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <i className='tabler-dots' />
                        <Typography>Other</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align='right'>{formatCurrency(report.otherCosts?.estimated || 0)}</TableCell>
                    <TableCell align='right'>
                      {editMode ? (
                        <TextField
                          type='number'
                          size='small'
                          value={actualCosts.other}
                          onChange={e => setActualCosts({ ...actualCosts, other: parseFloat(e.target.value) || 0 })}
                          InputProps={{
                            startAdornment: <InputAdornment position='start'>KES</InputAdornment>
                          }}
                          sx={{ width: 150 }}
                        />
                      ) : (
                        formatCurrency(report.otherCosts?.actual || 0)
                      )}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        color: (report.otherCosts?.variance || 0) < 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatCurrency(Math.abs(report.otherCosts?.variance || 0))}
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={
                          report.otherCosts?.estimated > 0
                            ? `${(((report.otherCosts?.variance || 0) / report.otherCosts?.estimated) * 100).toFixed(1)}%`
                            : 'N/A'
                        }
                        color={getVarianceColor(report.otherCosts?.variance || 0)}
                        size='small'
                      />
                    </TableCell>
                  </TableRow>

                  {/* Total Row */}
                  <TableRow sx={{ bgcolor: 'primary.light', fontWeight: 700 }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>TOTAL</TableCell>
                    <TableCell align='right' sx={{ fontWeight: 700, fontSize: '1rem' }}>
                      {formatCurrency(totalEstimated)}
                    </TableCell>
                    <TableCell align='right' sx={{ fontWeight: 700, fontSize: '1rem' }}>
                      {formatCurrency(totalActual)}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: variance < 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatCurrency(Math.abs(variance))}
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={`${Math.abs(variancePercent).toFixed(1)}%`}
                        color={getVarianceColor(variance)}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Status and Remarks */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant='h6' className='mb-4'>
                Report Details
              </Typography>
              <Grid container spacing={4}>
                <Grid size={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={status}
                      label='Status'
                      onChange={e => setStatus(e.target.value)}
                      disabled={!editMode}
                    >
                      <MenuItem value='draft'>Draft</MenuItem>
                      <MenuItem value='in_progress'>In Progress</MenuItem>
                      <MenuItem value='completed'>Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label='Remarks'
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    disabled={!editMode}
                    placeholder='Add any observations, notes, or recommendations...'
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </div>
      {/* End Printable Content */}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant='filled'>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Grid>
  )
}

export default CostReportViewPage
