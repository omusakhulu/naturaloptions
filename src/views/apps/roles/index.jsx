'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'

// Component Imports
import RoleCards from './RoleCards'
import RolesTable from './RolesTable'
import RoleMenuAccessEditor from './RoleMenuAccessEditor'

const Roles = ({ userData, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('all')

  // Filter users based on active tab (department/function)
  const getFilteredUsers = () => {
    if (!userData) return []
    
    switch (activeTab) {
      case 'management':
        // Management: SUPER_ADMIN, ADMIN, MANAGER
        return userData.filter(user => 
          user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MANAGER'
        )
      case 'sales':
        // Sales & Customer Service: SALES role
        return userData.filter(user => user.role === 'SALES')
      case 'warehouse':
        // Warehouse & Operations: USER role (field workers, warehouse staff, drivers)
        return userData.filter(user => user.role === 'USER')
      case 'finance':
        // Finance & Admin: ADMIN and MANAGER who handle financial operations
        return userData.filter(user => 
          user.role === 'ADMIN' || user.role === 'MANAGER'
        )
      case 'operations':
        // Operations Team: MANAGER and USER (project execution, warehouse, logistics)
        return userData.filter(user => 
          user.role === 'MANAGER' || user.role === 'USER'
        )
      case 'all':
      default:
        return userData
    }
  }

  const filteredUsers = getFilteredUsers()

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <Typography variant='h4' className='mbe-1'>
          Staff Management
        </Typography>
        <Typography>
          Manage user roles and assign staff to projects, clients, and tasks
        </Typography>
      </Grid>

      {/* Tabs */}
      <Grid size={12}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label={`All Staff (${userData?.length || 0})`} 
              value='all'
              icon={<i className='tabler-users' />}
              iconPosition='start'
            />
            <Tab 
              label={`Management (${userData?.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN' || u.role === 'MANAGER').length || 0})`} 
              value='management'
              icon={<i className='tabler-briefcase' />}
              iconPosition='start'
            />
            <Tab 
              label={`Sales Team (${userData?.filter(u => u.role === 'SALES').length || 0})`} 
              value='sales'
              icon={<i className='tabler-shopping-cart' />}
              iconPosition='start'
            />
            <Tab 
              label={`Warehouse (${userData?.filter(u => u.role === 'USER').length || 0})`} 
              value='warehouse'
              icon={<i className='tabler-building-warehouse' />}
              iconPosition='start'
            />
            <Tab 
              label={`Finance (${userData?.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER').length || 0})`} 
              value='finance'
              icon={<i className='tabler-coin' />}
              iconPosition='start'
            />
            <Tab 
              label={`Operations (${userData?.filter(u => u.role === 'MANAGER' || u.role === 'USER').length || 0})`} 
              value='operations'
              icon={<i className='tabler-truck-delivery' />}
              iconPosition='start'
            />
          </Tabs>
        </Box>
      </Grid>

      <Grid size={12}>
        <RoleCards userData={filteredUsers} onRoleUpdate={onRefresh} />
      </Grid>

      <Grid size={12}>
        <RoleMenuAccessEditor />
      </Grid>
      <Grid size={{ xs: 12 }} className='!pbs-12'>
        <Typography variant='h4' className='mbe-1'>
          {activeTab === 'management' ? 'Management Team' 
            : activeTab === 'sales' ? 'Sales Team' 
            : activeTab === 'warehouse' ? 'Warehouse Staff'
            : activeTab === 'finance' ? 'Finance Department'
            : activeTab === 'operations' ? 'Operations Team'
            : 'All Staff'} with Roles
        </Typography>
        <Typography>
          {activeTab === 'management' 
            ? 'Executive and management staff with administrative and supervisory roles'
            : activeTab === 'sales'
            ? 'Sales team responsible for customer relationships, quotes, and order management'
            : activeTab === 'warehouse'
            ? 'Warehouse staff, field workers, drivers, and ground operations team'
            : activeTab === 'finance'
            ? 'Finance and admin staff managing invoices, reports, and financial operations'
            : activeTab === 'operations'
            ? 'Operations team managing projects, logistics, and day-to-day execution'
            : 'All staff members across all departments and their current roles'}
        </Typography>
      </Grid>
      <Grid size={12}>
        <RolesTable tableData={filteredUsers} />
      </Grid>
    </Grid>
  )
}

export default Roles
