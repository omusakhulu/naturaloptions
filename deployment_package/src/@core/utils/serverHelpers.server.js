// Next Imports
import { cookies } from 'next/headers'

// Third-party Imports
import 'server-only'

// Config Imports
import themeConfig from '@configs/themeConfig'

export const getSettingsFromCookie = async () => {
  const cookieStore = await cookies()
  const cookieName = themeConfig.settingsCookieName

  return JSON.parse(cookieStore.get(cookieName)?.value || '{}')
}

export const getMode = async () => {
  const settingsCookie = await getSettingsFromCookie()

  // Get mode from cookie or fallback to theme config
  return settingsCookie.mode || themeConfig.mode
}

export const getSystemMode = () => {
  return themeConfig.mode
}

// For backward compatibility
export const getServerMode = getMode
