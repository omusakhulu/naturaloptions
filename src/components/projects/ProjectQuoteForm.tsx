'use client'

import { useState } from 'react'

import Stage4CrewDetails from './Stage4CrewDetails'
import Stage5Transport from './Stage5Transport'

interface CrewDetail {
  id?: string
  workType: string
  numberOfCrew: number
  shiftsNeeded: number
  fare: number
  accommodation: string
  rate?: number
  days?: number
  amount?: number
}

interface Transport {
  id?: string
  vehicleType: string
  numberOfTrips: number
  pricePerTrip: number
  contingency: number
  rate?: number
  amount?: number
}

interface ProjectQuoteFormProps {
  projectId?: string
  projectName?: string
}

export default function ProjectQuoteForm({ projectId: initialProjectId, projectName }: ProjectQuoteFormProps) {
  const [currentStage, setCurrentStage] = useState(4) // Start at Stage 4 as requested
  const [projectId, setProjectId] = useState(initialProjectId || '')
  const [crewDetails, setCrewDetails] = useState<CrewDetail[]>([])
  const [transport, setTransport] = useState<Transport[]>([])

  const handleCrewDetailsNext = (data: CrewDetail[]) => {
    setCrewDetails(data)
    setCurrentStage(5)
  }

  const handleCrewDetailsBack = () => {
    // Go back to previous stage (Stage 3 or wherever you need)
    setCurrentStage(3)
  }

  const handleTransportBack = () => {
    setCurrentStage(4)
  }

  const handleTransportSubmit = async (data: Transport[]) => {
    setTransport(data)

    // Final submission logic
    try {
      // Update project status to submitted
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'submitted' })
      })

      alert('Quote submitted successfully!')

      // Redirect or show success message
      window.location.href = '/apps/projects/list'
    } catch (error) {
      console.error('Error submitting quote:', error)
      alert('Failed to submit quote')
    }
  }

  return (
    <div className='w-full'>
      {currentStage === 4 && (
        <Stage4CrewDetails
          projectId={projectId}
          initialData={crewDetails}
          onBack={handleCrewDetailsBack}
          onNext={handleCrewDetailsNext}
        />
      )}

      {currentStage === 5 && (
        <Stage5Transport
          projectId={projectId}
          initialData={transport}
          crewDetails={crewDetails}
          onBack={handleTransportBack}
          onSubmit={handleTransportSubmit}
        />
      )}
    </div>
  )
}
