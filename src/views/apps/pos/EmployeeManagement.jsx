// Employee Management for POS System
'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Schedule,
  AccessTime,
  PersonAdd,
  Work,
  MoreVert,
  LocationOn,
  CheckCircle,
  Cancel,
  Timer
} from '@mui/icons-material'

const EmployeeManagement = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [employees, setEmployees] = useState([])
  const [timeClockEntries, setTimeClockEntries] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    hourlyRate: '',
    locationId: '',
    pin: ''
  })

  // Sample employee data
  const sampleEmployees = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@naturaloptions.com',
      phone: '(555) 123-4567',
      role: 'MANAGER',
      hourlyRate: 18.50,
      locationId: '1',
      locationName: 'Main Store',
      pin: '1234',
      active: true,
      startDate: '2025-01-15',
      avatar: null,
      totalHoursThisWeek: 38.5,
      status: 'clocked_out'
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@naturaloptions.com',
      phone: '(555) 234-5678',
      role: 'CASHIER',
      hourlyRate: 15.00,
      locationId: '1',
      locationName: 'Main Store',
      pin: '2345',
      active: true,
      startDate: '2025-02-01',
      avatar: null,
      totalHoursThisWeek: 32.0,
      status: 'clocked_in'
    },
    {
      id: '3',
      firstName: 'Mike',
      lastName: 'Davis',
      email: 'mike.davis@naturaloptions.com',
      phone: '(555) 345-6789',
      role: 'SALES',
      hourlyRate: 16.25,
      locationId: '2',
      locationName: 'North Branch',
      pin: '3456',
      active: true,
      startDate: '2025-03-10',
      avatar: null,
      totalHoursThisWeek: 40.0,
      status: 'on_break'
    }
  ]

  // Sample time clock entries
  const sampleTimeEntries = [
    {
      id: '1',
      employeeId: '1',
      employeeName: 'John Smith',
      clockIn: '2025-11-06T09:00:00',
      clockOut: '2025-11-06T17:30:00',
      breakMinutes: 60,
      hoursWorked: 7.5,
      status: 'CLOCKED_OUT',
      locationId: '1'
    },
    {
      id: '2',
      employeeId: '2',
      employeeName: 'Sarah Johnson',
      clockIn: '2025-11-06T10:00:00',
      clockOut: null,
      breakMinutes: 30,
      hoursWorked: null,
      status: 'CLOCKED_IN',
      locationId: '1'
    },
    {
      id: '3',
      employeeId: '3',
      employeeName: 'Mike Davis',
      clockIn: '2025-11-06T08:30:00',
      clockOut: null,
      breakMinutes: 45,
      hoursWorked: null,
      status: 'ON_BREAK',
      locationId: '2'
    }
  ]

  const locations = [
    { id: '1', name: 'Main Store' },
    { id: '2', name: 'North Branch' },
    { id: '3', name: 'Downtown Location' }
  ]

  const userRoles = [
    { value: 'CASHIER', label: 'Cashier', color: 'primary' },
    { value: 'SALES', label: 'Sales Associate', color: 'info' },
    { value: 'MANAGER', label: 'Manager', color: 'success' },
    { value: 'ADMIN', label: 'Administrator', color: 'error' }
  ]

  useEffect(() => {
    setEmployees(sampleEmployees)
    setTimeClockEntries(sampleTimeEntries)
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleConfig = (role) => {
    return userRoles.find(r => r.value === role) || { color: 'default', label: role }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'clocked_in': return 'success'
      case 'clocked_out': return 'default'
      case 'on_break': return 'warning'
      default: return 'default'
    }
  }

  const handleCreateEmployee = () => {
    setSelectedEmployee(null)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      hourlyRate: '',
      locationId: '',
      pin: ''
    })
    setDialogOpen(true)
  }

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee)
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      hourlyRate: employee.hourlyRate.toString(),
      locationId: employee.locationId,
      pin: employee.pin
    })
    setDialogOpen(true)
  }

  const handleSaveEmployee = () => {
    console.log('Saving employee:', formData)
    setDialogOpen(false)
  }

  const EmployeeList = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Employee Directory</Typography>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={handleCreateEmployee}
          >
            Add Employee
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Hourly Rate</TableCell>
                <TableCell>Hours This Week</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => {
                const roleConfig = getRoleConfig(employee.role)
                return (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {employee.firstName[0]}{employee.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {employee.firstName} {employee.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {employee.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={roleConfig.label}
                        color={roleConfig.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOn fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        {employee.locationName}
                      </Box>
                    </TableCell>
                    <TableCell>{formatCurrency(employee.hourlyRate)}/hr</TableCell>
                    <TableCell>{employee.totalHoursThisWeek} hrs</TableCell>
                    <TableCell>
                      <Chip
                        label={employee.status.replace('_', ' ')}
                        color={getStatusColor(employee.status)}
                        size="small"
                        icon={
                          employee.status === 'clocked_in' ? <CheckCircle /> :
                          employee.status === 'on_break' ? <Timer /> : <Cancel />
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEditEmployee(employee)}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small">
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )

  const TimeClockManagement = () => (
    <Grid container spacing={3}>
      {/* Currently Clocked In */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Currently Working</Typography>
            <List>
              {timeClockEntries.filter(entry => entry.status !== 'CLOCKED_OUT').map((entry, index) => (
                <div key={entry.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: entry.status === 'CLOCKED_IN' ? 'success.main' : 'warning.main' }}>
                        {entry.status === 'CLOCKED_IN' ? <Work /> : <Timer />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={entry.employeeName}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Clocked in: {formatTime(entry.clockIn)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Break time: {entry.breakMinutes} min
                          </Typography>
                          <Chip
                            label={entry.status.replace('_', ' ')}
                            color={entry.status === 'CLOCKED_IN' ? 'success' : 'warning'}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < timeClockEntries.filter(entry => entry.status !== 'CLOCKED_OUT').length - 1 && <Divider />}
                </div>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Time Clock Summary */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Today's Activity</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="h4" sx={{ color: 'success.dark', fontWeight: 'bold' }}>
                    {timeClockEntries.filter(e => e.status === 'CLOCKED_IN').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'success.dark' }}>
                    Clocked In
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="h4" sx={{ color: 'warning.dark', fontWeight: 'bold' }}>
                    {timeClockEntries.filter(e => e.status === 'ON_BREAK').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'warning.dark' }}>
                    On Break
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Total labor hours today: {timeClockEntries
                  .filter(e => e.hoursWorked)
                  .reduce((sum, e) => sum + e.hoursWorked, 0)
                  .toFixed(1)} hours
              </Typography>
            </Alert>
          </CardContent>
        </Card>

        {/* Recent Time Entries */}
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Recent Time Entries</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Clock In</TableCell>
                    <TableCell>Clock Out</TableCell>
                    <TableCell>Hours</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeClockEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.employeeName}</TableCell>
                      <TableCell>{formatTime(entry.clockIn)}</TableCell>
                      <TableCell>
                        {entry.clockOut ? formatTime(entry.clockOut) : 'Still working'}
                      </TableCell>
                      <TableCell>
                        {entry.hoursWorked ? `${entry.hoursWorked} hrs` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Employee Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage employees, schedules, and time tracking
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Employees" icon={<PersonAdd />} />
          <Tab label="Time Clock" icon={<AccessTime />} />
          <Tab label="Schedules" icon={<Schedule />} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && <EmployeeList />}
      {activeTab === 1 && <TimeClockManagement />}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6">Schedules</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Schedule management coming soon...
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Employee Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="PIN"
                value={formData.pin}
                onChange={(e) => setFormData({...formData, pin: e.target.value})}
                fullWidth
                helperText="4-digit PIN for POS login"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  label="Role"
                >
                  {userRoles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Hourly Rate"
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                fullWidth
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Primary Location</InputLabel>
                <Select
                  value={formData.locationId}
                  onChange={(e) => setFormData({...formData, locationId: e.target.value})}
                  label="Primary Location"
                >
                  {locations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveEmployee}
            disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.role}
          >
            {selectedEmployee ? 'Update' : 'Create'} Employee
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EmployeeManagement
