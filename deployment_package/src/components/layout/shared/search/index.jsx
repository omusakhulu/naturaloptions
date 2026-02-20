'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import IconButton from '@mui/material/IconButton'

// Component Imports
import GlobalSearch from './GlobalSearch'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'
import { useSettings } from '@core/hooks/useSettings'

// Style Imports
import './styles.css'

const NavSearch = () => {
  // States
  const [open, setOpen] = useState(false)
  
  // Hooks
  const { isBreakpointReached } = useVerticalNav()
  const { settings } = useSettings()

  // Keyboard shortcut to open search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])


  return (
    <>
      {isBreakpointReached || settings.layout === 'horizontal' ? (
        <IconButton className='text-textPrimary' onClick={() => setOpen(true)}>
          <i className='tabler-search text-2xl' />
        </IconButton>
      ) : (
        <div className='flex items-center gap-2 cursor-pointer' onClick={() => setOpen(true)}>
          <IconButton className='text-textPrimary' onClick={() => setOpen(true)}>
            <i className='tabler-search text-2xl' />
          </IconButton>
          <div className='whitespace-nowrap select-none text-textDisabled'>Search ⌘K</div>
        </div>
      )}
      <GlobalSearch open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export default NavSearch
