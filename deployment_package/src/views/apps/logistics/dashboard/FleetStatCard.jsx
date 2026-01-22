'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'

const FleetStatCard = ({ title, value, subtitle, icon, color = 'primary' }) => {
  const colorMap = {
    primary: 'primary.light',
    success: 'success.light',
    warning: 'warning.light',
    info: 'info.light',
    error: 'error.light'
  }

  return (
    <Card>
      <CardContent>
        <Box display='flex' alignItems='center' gap={2}>
          <Avatar sx={{ bgcolor: colorMap[color], width: 48, height: 48 }}>
            <i className={icon} style={{ fontSize: 24 }} />
          </Avatar>
          <Box>
            <Typography variant='body2' color='text.secondary'>
              {title}
            </Typography>
            <Typography variant='h5' fontWeight='bold'>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant='caption' color='text.secondary'>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default FleetStatCard
