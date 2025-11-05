'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

// Component Imports
import DriversTable from './DriversTable'
import VehiclesTable from './VehiclesTable'

const FleetManagement = () => {
  const [activeTab, setActiveTab] = useState('drivers')

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  return (
    <Grid container spacing={6}>
      {/* Header */}
      <Grid item xs={12}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <div>
            <Typography variant='h4' fontWeight='bold'>
              Fleet Management
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Manage drivers, vehicles, and assignments
            </Typography>
          </div>
        </Box>
      </Grid>

      {/* Tabs */}
      <Grid item xs={12}>
        <TabContext value={activeTab}>
          <TabList onChange={handleTabChange} aria-label='fleet management tabs'>
            <Tab icon={<i className='tabler-users' />} iconPosition='start' value='drivers' label='Drivers' />
            <Tab icon={<i className='tabler-truck' />} iconPosition='start' value='vehicles' label='Vehicles' />
          </TabList>

          <TabPanel value='drivers' sx={{ p: 0, pt: 4 }}>
            <DriversTable />
          </TabPanel>

          <TabPanel value='vehicles' sx={{ p: 0, pt: 4 }}>
            <VehiclesTable />
          </TabPanel>
        </TabContext>
      </Grid>
    </Grid>
  )
}

export default FleetManagement
