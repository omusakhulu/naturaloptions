// Next Imports
import { headers } from 'next/headers'

import { getServerSession } from 'next-auth'

// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Component Imports
import AuthProvider from '@/components/providers/AuthProvider'
import WebhookInitializer from '@/components/WebhookInitializer'

// HOC Imports
import TranslationWrapper from '@/hocs/TranslationWrapper'

// Config Imports
import { i18n } from '@configs/i18n'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'Omnishop Portal',
  description: 'Omnishop Portal.'
}

// Generate static params for all supported languages
export async function generateStaticParams() {
  return i18n.locales.map(locale => ({
    lang: locale
  }))
}

const RootLayout = async props => {
  const params = await props.params
  const { children } = props

  // Vars
  const headersList = await headers()
  const systemMode = await getSystemMode()
  const direction = i18n.langDirection[params.lang]
  const session = await getServerSession()

  return (
    <TranslationWrapper headersList={headersList} lang={params.lang}>
      <div id='__next' lang={params.lang} dir={direction} className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
        <AuthProvider session={session}>
          <WebhookInitializer />
          {children}
        </AuthProvider>
      </div>
    </TranslationWrapper>
  )
}

export default RootLayout
