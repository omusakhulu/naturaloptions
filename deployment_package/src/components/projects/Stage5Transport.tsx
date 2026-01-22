'use client'

import { useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'

interface Transport {
  id?: string
  vehicleType: string
  numberOfTrips: number
  pricePerTrip: number
  contingency: number
}

interface Stage5Props {
  projectId: string
  initialData?: Transport[]
  crewDetails: any[] // Passed from Stage 4 to prevent undefined errors
  onBack: () => void
  onSubmit: (data: Transport[]) => void
}

export default function Stage5Transport({
  projectId,
  initialData = [],
  crewDetails = [],
  onBack,
  onSubmit
}: Stage5Props) {
  const [transports, setTransports] = useState<Transport[]>(initialData)

  const [currentTransport, setCurrentTransport] = useState<Transport>({
    vehicleType: '',
    numberOfTrips: 0,
    pricePerTrip: 0,
    contingency: 0
  })

  const [submitting, setSubmitting] = useState(false)

  const handleAddTransport = () => {
    if (!currentTransport.vehicleType || currentTransport.numberOfTrips <= 0 || currentTransport.pricePerTrip <= 0) {
      alert('Please fill in all required fields')

      return
    }

    setTransports([...transports, { ...currentTransport }])
    setCurrentTransport({
      vehicleType: '',
      numberOfTrips: 0,
      pricePerTrip: 0,
      contingency: 0
    })
  }

  const handleRemoveTransport = (index: number) => {
    setTransports(transports.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (transports.length === 0) {
      alert('Please add at least one transport detail')

      return
    }

    // Check if crew details exist to prevent undefined errors
    if (!crewDetails || crewDetails.length === 0) {
      alert('Error: Crew details not found. Please go back and complete Stage 4.')

      return
    }

    setSubmitting(true)

    try {
      // Save each transport detail to the database
      for (const transport of transports) {
        if (!transport.id) {
          await fetch(`/api/projects/${projectId}/transport`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transport)
          })
        }
      }

      onSubmit(transports)
    } catch (error) {
      console.error('Error saving transport details:', error)
      alert('Failed to save transport details')
    } finally {
      setSubmitting(false)
    }
  }

  const calculateTotal = (transport: Transport) => {
    return transport.numberOfTrips * transport.pricePerTrip + (transport.contingency || 0)
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h5' className='mb-6'>
          Stage 5: Transport
        </Typography>

        {/* Add New Transport Form */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          <TextField
            fullWidth
            label='Vehicle Type *'
            value={currentTransport.vehicleType}
            onChange={e => setCurrentTransport({ ...currentTransport, vehicleType: e.target.value })}
            placeholder='e.g., Truck, Van, Lorry'
          />

          <TextField
            fullWidth
            type='number'
            label='Number of Trips *'
            value={currentTransport.numberOfTrips || ''}
            onChange={e => setCurrentTransport({ ...currentTransport, numberOfTrips: parseInt(e.target.value) || 0 })}
            inputProps={{ min: 1 }}
          />

          <TextField
            fullWidth
            type='number'
            label='Price per Trip *'
            value={currentTransport.pricePerTrip || ''}
            onChange={e => setCurrentTransport({ ...currentTransport, pricePerTrip: parseFloat(e.target.value) || 0 })}
            inputProps={{ min: 0, step: '0.01' }}
          />

          <TextField
            fullWidth
            type='number'
            label='Contingency'
            value={currentTransport.contingency || ''}
            onChange={e => setCurrentTransport({ ...currentTransport, contingency: parseFloat(e.target.value) || 0 })}
            inputProps={{ min: 0, step: '0.01' }}
          />
        </div>

        <div className='mb-6'>
          <Button variant='contained' color='primary' onClick={handleAddTransport} fullWidth>
            Add Transport
          </Button>
        </div>

        {/* Transport Table */}
        {transports.length > 0 && (
          <TableContainer component={Paper} className='mb-6'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vehicle Type</TableCell>
                  <TableCell align='right'>Trips</TableCell>
                  <TableCell align='right'>Price/Trip</TableCell>
                  <TableCell align='right'>Contingency</TableCell>
                  <TableCell align='right'>Total</TableCell>
                  <TableCell align='center'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transports.map((transport, index) => (
                  <TableRow key={index}>
                    <TableCell>{transport.vehicleType}</TableCell>
                    <TableCell align='right'>{transport.numberOfTrips}</TableCell>
                    <TableCell align='right'>${transport.pricePerTrip.toFixed(2)}</TableCell>
                    <TableCell align='right'>${(transport.contingency || 0).toFixed(2)}</TableCell>
                    <TableCell align='right'>${calculateTotal(transport).toFixed(2)}</TableCell>
                    <TableCell align='center'>
                      <IconButton color='error' size='small' onClick={() => handleRemoveTransport(index)}>
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
          <Button
            variant='contained'
            color='success'
            onClick={handleSubmit}
            disabled={submitting || transports.length === 0}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
