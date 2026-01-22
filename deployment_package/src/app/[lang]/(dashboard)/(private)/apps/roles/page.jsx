// Component Imports
'use client'

import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { toast } from 'react-hot-toast'

// Component Imports

// Styled Component Imports
// import { classnames } from '@core/utils/classnames'
import classnames from 'classnames'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings.jsx'

import Roles from '@views/apps/roles'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

const RolesApp = () => {
  // States
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  // Hooks
  const { settings } = useSettings()
  const { lang: locale } = settings
  const router = useRouter()
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/users')

      if (!res.ok) {
        throw new Error('Failed to fetch users')
      }

      const users = await res.json()

      setData(users)

      return users
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchUsers()
  }, [])

  // Vars
  const hidden = {
    xs: false,
    sm: false,
    md: false
  }

  return (
    <div className='flex flex-col gap-6'>
      <Roles userData={data} loading={loading} onRefresh={fetchUsers} />
    </div>
  )
}

export default RolesApp
