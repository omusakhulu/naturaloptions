'use client'

import { useState, useEffect } from 'react'

import { useRouter, useParams } from 'next/navigation'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'

import Stage4CrewDetails from '@/components/projects/Stage4CrewDetails'
import Stage5Transport from '@/components/projects/Stage5Transport'

const steps = ['Project Info', 'Crew Details', 'Transport']

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id

  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Project data
  const [project, setProject] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [projectStatus, setProjectStatus] = useState('draft')
  const [crewDetails, setCrewDetails] = useState([])
  const [transport, setTransport] = useState([])

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}`)
      const data = await response.json()

      if (data.success && data.project) {
        const proj = data.project

        setProject(proj)
        setProjectName(proj.name)
        setProjectStatus(proj.status)
        setCrewDetails(proj.crewDetails || [])
        setTransport(proj.transport || [])
      } else {
        alert('Project not found')
        router.push('/apps/projects/list')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      alert('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProjectInfo = async () => {
    if (!projectName.trim()) {
      alert('Please enter a project name')

      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          status: projectStatus
        })
      })

      const data = await response.json()

      if (data.success) {
        setActiveStep(1)
      } else {
        alert('Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Failed to update project')
    } finally {
      setSaving(false)
    }
  }

  const handleCrewDetailsNext = data => {
    setCrewDetails(data)
    setActiveStep(2)
  }

  const handleCrewDetailsBack = () => {
    setActiveStep(0)
  }

  const handleTransportBack = () => {
    setActiveStep(1)
  }

  const handleTransportSubmit = async data => {
    setTransport(data)

    try {
      alert('Project updated successfully!')
      router.push(`/apps/projects/${projectId}`)
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Failed to update project')
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <CircularProgress />
      </div>
    )
  }

  if (!project) {
    return (
      <Card>
        <CardContent>
          <Typography>Project not found</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <div className='flex justify-between items-center'>
          <div>
            <Typography variant='h4'>Edit Project</Typography>
            <Typography color='text.secondary' className='mt-1'>
              {project.name}
            </Typography>
          </div>
          <Button variant='outlined' onClick={() => router.push(`/apps/projects/${projectId}`)}>
            Back to Project
          </Button>
        </div>
      </Grid>

      <Grid size={12}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Grid>

      <Grid size={12}>
        {activeStep === 0 && (
          <Card>
            <CardContent>
              <Typography variant='h5' className='mb-6'>
                Project Information
              </Typography>

              <Grid container spacing={4}>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label='Project Name *'
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder='Enter project name'
                  />
                </Grid>

                <Grid size={12}>
                  <FormControl fullWidth>
                    <InputLabel>Project Status</InputLabel>
                    <Select
                      value={projectStatus}
                      label='Project Status'
                      onChange={e => setProjectStatus(e.target.value)}
                    >
                      {statusOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <div className='flex justify-end gap-4 mt-6'>
                <Button variant='outlined' onClick={() => router.push(`/apps/projects/${projectId}`)}>
                  Cancel
                </Button>
                <Button variant='contained' onClick={handleUpdateProjectInfo} disabled={saving || !projectName.trim()}>
                  {saving ? 'Saving...' : 'Next'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeStep === 1 && projectId && (
          <Stage4CrewDetails
            projectId={projectId}
            initialData={crewDetails}
            onBack={handleCrewDetailsBack}
            onNext={handleCrewDetailsNext}
          />
        )}

        {activeStep === 2 && projectId && (
          <Stage5Transport
            projectId={projectId}
            initialData={transport}
            crewDetails={crewDetails}
            onBack={handleTransportBack}
            onSubmit={handleTransportSubmit}
          />
        )}
      </Grid>
    </Grid>
  )
}
