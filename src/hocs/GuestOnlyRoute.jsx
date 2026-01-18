// Next Imports
import { redirect } from 'next/navigation'

// Third-party Imports
import { getServerSession } from 'next-auth'

// Config Imports
import themeConfig from '@configs/themeConfig'

import { authOptions } from '@/config/auth'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const GuestOnlyRoute = async ({ children, lang }) => {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect(getLocalizedUrl(themeConfig.homePageUrl, lang))
  }

  return <>{children}</>
}

export default GuestOnlyRoute
