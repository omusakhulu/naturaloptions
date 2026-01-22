'use client'

// React Imports
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Layout Imports
import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'

// Component Imports
import Navigation from '@components/layout/vertical/Navigation'
import Navbar from '@components/layout/vertical/Navbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import ScrollToTop from '@core/components/scroll-to-top'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Default system mode
const DEFAULT_SYSTEM_MODE = 'light'

const LayoutContent = ({ children, systemMode }) => {
  const theme = useTheme()
  const { settings } = useSettings()
  const { mode } = settings || {}
  const params = useParams()
  const { lang: locale } = params || {}

  return (
    <LayoutWrapper
      systemMode={systemMode}
      verticalLayout={
        <VerticalLayout 
          navigation={
            <Navigation 
              mode={mode}
              locale={locale}
            />
          } 
          navbar={<Navbar />} 
          footer={<VerticalFooter />}
        >
          {children}
          <ScrollToTop className='mui-fixed' />
        </VerticalLayout>
      }
      verticalAppBarContent={props => (
        <div className='flex items-center'>{/* Add any app bar content here if needed */}</div>
      )}
      verticalNavItems={[]}
      verticalNavMenuContent={userMenu => null}
      verticalNavMenuBranding={props => null}
      afterVerticalNavMenuContent={props => null}
      beforeVerticalNavMenuContent={props => null}
      verticalNavItemSx={{}}
      verticalNavHeader={props => null}
      verticalNavContent={props => null}
      verticalNavContentStyle={{}}
      verticalNavFooter={props => null}
      verticalNavCollapsed={false}
      verticalNavWidth={260}
      verticalNavTheme='light'
      verticalNavAnchor='left'
      verticalNavCollapsedWidth={70}
      verticalNavMini={false}
      verticalNavMiniVariantWidth={70}
      verticalNavContainerStyles={{}}
    >
      {children}
    </LayoutWrapper>
  )
}

const ClientLayout = ({ children }) => {
  const [systemMode, setSystemMode] = useState(DEFAULT_SYSTEM_MODE)
  const [mounted, setMounted] = useState(false)
  
  // Set system mode on client-side
  useEffect(() => {
    setMounted(true)
    setSystemMode(DEFAULT_SYSTEM_MODE)
  }, [])

  // Don't render anything until we're on the client
  if (!mounted) return null
  
  return (
    <LayoutContent systemMode={systemMode}>
      {children}
    </LayoutContent>
  )
}

// Create a wrapper component that uses the settings context
const ClientLayoutWrapper = ({ children }) => {
  const { settings } = useSettings()
  
  return <ClientLayout>{children}</ClientLayout>
}

export default ClientLayoutWrapper
