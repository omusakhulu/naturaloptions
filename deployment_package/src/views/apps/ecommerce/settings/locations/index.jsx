// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import LocationName from './LocationName'
import Address from './Address'

const Locations = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <LocationName />
      </Grid>
      <Grid size={12}>
        <Address />
      </Grid>
    </Grid>
  )
}

export default Locations
