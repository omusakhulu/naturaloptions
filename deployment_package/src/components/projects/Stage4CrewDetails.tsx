'use client'

import { useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'

const workTypes = [
  { value: 'loading_offloading', label: 'Loading / Offloading' },
  { value: 'buttoning_up_during_event', label: 'Buttoning up / During event' },
  { value: 'standby', label: 'Standby' },
  { value: 'build', label: 'Build' },
  { value: 'takedown_return', label: 'Takedown / Return' },
  { value: 'roof_floor_walls', label: 'Roof / Floor / Walls' },
  { value: 'carpeting_general_cleaning', label: 'Carpeting and General cleaning' }
]

interface CrewDetail {
  id?: string
  workType: string
  numberOfCrew: number
  shiftsNeeded: number
  fare: number
  accommodation: string
}

interface Stage4Props {
  projectId: string
  initialData?: CrewDetail[]
  onBack: () => void
  onNext: (data: CrewDetail[]) => void
}

export default function Stage4CrewDetails({ projectId, initialData = [], onBack, onNext }: Stage4Props) {
  const [crewDetails, setCrewDetails] = useState<CrewDetail[]>(initialData)

  const [currentDetail, setCurrentDetail] = useState<CrewDetail>({
    workType: '',
    numberOfCrew: 0,
    shiftsNeeded: 0,
    fare: 0,
    accommodation: ''
  })

  const [saving, setSaving] = useState(false)

  const handleAddDetail = () => {
    if (
      !currentDetail.workType ||
      currentDetail.numberOfCrew <= 0 ||
      currentDetail.shiftsNeeded <= 0 ||
      currentDetail.fare <= 0
    ) {
      alert('Please fill in all required fields')

      return
    }

    setCrewDetails([...crewDetails, { ...currentDetail }])
    setCurrentDetail({
      workType: '',
      numberOfCrew: 0,
      shiftsNeeded: 0,
      fare: 0,
      accommodation: ''
    })
  }

  const handleRemoveDetail = (index: number) => {
    setCrewDetails(crewDetails.filter((_, i) => i !== index))
  }

  const handleSaveAndNext = async () => {
    if (crewDetails.length === 0) {
      alert('Please add at least one crew detail')

      return
    }

    setSaving(true)

    try {
      // Save each crew detail to the database
      for (const detail of crewDetails) {
        if (!detail.id) {
          await fetch(`/api/projects/${projectId}/crew-details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(detail)
          })
        }
      }

      onNext(crewDetails)
    } catch (error) {
      console.error('Error saving crew details:', error)
      alert('Failed to save crew details')
    } finally {
      setSaving(false)
    }
  }

  const getWorkTypeLabel = (value: string) => {
    return workTypes.find(wt => wt.value === value)?.label || value
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h5' className='mb-6'>
          Stage 4: Crew Details
        </Typography>

        {/* Add New Crew Detail Form */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
          <FormControl fullWidth>
            <InputLabel>Type of Work *</InputLabel>
            <Select
              value={currentDetail.workType}
              label='Type of Work *'
              onChange={e => setCurrentDetail({ ...currentDetail, workType: e.target.value })}
            >
              {workTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type='number'
            label='Number of Crew *'
            value={currentDetail.numberOfCrew || ''}
            onChange={e => setCurrentDetail({ ...currentDetail, numberOfCrew: parseInt(e.target.value) || 0 })}
            inputProps={{ min: 1 }}
          />

          <TextField
            fullWidth
            type='number'
            label='Shifts Needed *'
            value={currentDetail.shiftsNeeded || ''}
            onChange={e => setCurrentDetail({ ...currentDetail, shiftsNeeded: parseInt(e.target.value) || 0 })}
            inputProps={{ min: 1 }}
          />

          <TextField
            fullWidth
            type='number'
            label='Fare *'
            value={currentDetail.fare || ''}
            onChange={e => setCurrentDetail({ ...currentDetail, fare: parseFloat(e.target.value) || 0 })}
            inputProps={{ min: 0, step: '0.01' }}
          />

          <TextField
            fullWidth
            label='Accommodation'
            value={currentDetail.accommodation}
            onChange={e => setCurrentDetail({ ...currentDetail, accommodation: e.target.value })}
          />

          <div className='flex items-end'>
            <Button variant='contained' color='primary' onClick={handleAddDetail} fullWidth>
              Add Crew Detail
            </Button>
          </div>
        </div>

        {/* Crew Details Table */}
        {crewDetails.length > 0 && (
          <TableContainer component={Paper} className='mb-6'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type of Work</TableCell>
                  <TableCell align='right'>Crew</TableCell>
                  <TableCell align='right'>Shifts</TableCell>
                  <TableCell align='right'>Fare</TableCell>
                  <TableCell>Accommodation</TableCell>
                  <TableCell align='center'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {crewDetails.map((detail, index) => (
                  <TableRow key={index}>
                    <TableCell>{getWorkTypeLabel(detail.workType)}</TableCell>
                    <TableCell align='right'>{detail.numberOfCrew}</TableCell>
                    <TableCell align='right'>{detail.shiftsNeeded}</TableCell>
                    <TableCell align='right'>${detail.fare.toFixed(2)}</TableCell>
                    <TableCell>{detail.accommodation || '-'}</TableCell>
                    <TableCell align='center'>
                      <IconButton color='error' size='small' onClick={() => handleRemoveDetail(index)}>
                        <i className='tabler-trash' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Navigation Buttons */}
        <div className='flex justify-between gap-4'>
          <Button variant='outlined' onClick={onBack}>
            Back
          </Button>
          <Button variant='contained' onClick={handleSaveAndNext} disabled={saving || crewDetails.length === 0}>
            {saving ? 'Saving...' : 'Save and Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
