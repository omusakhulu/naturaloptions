'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'

const ProjectActions = ({ projectId, projectName }) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState('') // 'boq' or 'cost-report'
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const handleGenerateBOQ = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/generate-boq`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        setSnackbar({
          open: true,
          message: `BOQ ${data.boq.boqNumber} generated successfully!`,
          severity: 'success'
        })
        setDialogOpen(false)
        
        // Redirect to BOQ view after a short delay
        setTimeout(() => {
          router.push(`/apps/boq/view/${data.boq.id}`)
        }, 1500)
      } else {
        setSnackbar({
          open: true,
          message: data.error || 'Failed to generate BOQ',
          severity: 'error'
        })
      }
    } catch (error) {
      console.error('Error generating BOQ:', error)
      setSnackbar({
        open: true,
        message: 'Error generating BOQ',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCostReport = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/generate-cost-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'draft'
        })
      })

      const data = await response.json()

      if (data.success) {
        setSnackbar({
          open: true,
          message: `Cost Report ${data.costReport.reportNumber} generated successfully!`,
          severity: 'success'
        })
        setDialogOpen(false)
        
        // Redirect to cost report view after a short delay
        setTimeout(() => {
          router.push(`/apps/projects/cost-reports/view/${data.costReport.id}`)
        }, 1500)
      } else {
        setSnackbar({
          open: true,
          message: data.error || 'Failed to generate cost report',
          severity: 'error'
        })
      }
    } catch (error) {
      console.error('Error generating cost report:', error)
      setSnackbar({
        open: true,
        message: 'Error generating cost report',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (type) => {
    setDialogType(type)
    setDialogOpen(true)
  }

  const handleConfirm = () => {
    if (dialogType === 'boq') {
      handleGenerateBOQ()
    } else {
      handleGenerateCostReport()
    }
  }

  return (
    <>
      <div className='flex gap-2'>
        <Button
          variant='contained'
          color='primary'
          startIcon={<i className='tabler-file-invoice' />}
          onClick={() => openDialog('boq')}
          disabled={loading}
        >
          Generate BOQ
        </Button>
        <Button
          variant='contained'
          color='secondary'
          startIcon={<i className='tabler-report-money' />}
          onClick={() => openDialog('cost-report')}
          disabled={loading}
        >
          Generate Cost Report
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={() => !loading && setDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          {dialogType === 'boq' ? 'Generate BOQ' : 'Generate Cost Report'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType === 'boq'
              ? `Generate a Bill of Quantities for project "${projectName}"? This will create a new BOQ with all crew, transport, and material details.`
              : `Generate a Cost Report for project "${projectName}"? This will create a new report with estimated costs. You can add actual costs later.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant='contained'
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant='filled'
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default ProjectActions
