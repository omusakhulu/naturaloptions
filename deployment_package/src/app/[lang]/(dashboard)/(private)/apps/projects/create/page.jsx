'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'

import Stage4CrewDetails from '@/components/projects/Stage4CrewDetails'
import Stage5Transport from '@/components/projects/Stage5Transport'

const steps = ['Project Info', 'Crew Details', 'Transport']

export default function CreateProjectPage() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)
  const [projectId, setProjectId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [crewDetails, setCrewDetails] = useState([])
  const [transport, setTransport] = useState([])
  const [creating, setCreating] = useState(false)

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      alert('Please enter a project name')

      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, status: 'draft' })
      })

      const data = await response.json()

      if (data.success && data.project) {
        setProjectId(data.project.id)
        setActiveStep(1)
      } else {
        alert('Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
    } finally {
      setCreating(false)
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
      // Update project status to submitted
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'submitted' })
      })

      alert('Quote submitted successfully!')
      router.push('/apps/projects/list')
    } catch (error) {
      console.error('Error submitting quote:', error)
      alert('Failed to submit quote')
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h4'>Create New Project Quote</Typography>
      </Grid>

      <Grid item xs={12}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Grid>

      <Grid item xs={12}>
        {activeStep === 0 && (
          <Card>
            <CardContent>
              <Typography variant='h5' className='mb-6'>
                Project Information
              </Typography>

              <TextField
                fullWidth
                label='Project Name *'
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder='Enter project name'
                className='mb-6'
              />

              <div className='flex justify-end gap-4'>
                <Button variant='outlined' onClick={() => router.push('/apps/projects/list')}>
                  Cancel
                </Button>
                <Button variant='contained' onClick={handleCreateProject} disabled={creating || !projectName.trim()}>
                  {creating ? 'Creating...' : 'Next'}
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
