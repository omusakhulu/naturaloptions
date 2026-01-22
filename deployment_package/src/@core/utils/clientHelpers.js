// Config Imports
import themeConfig from '@configs/themeConfig'

// Client-side version of getSettingsFromCookie
export const getSettingsFromCookie = () => {
  if (typeof window === 'undefined') return {}

  const cookieName = themeConfig.settingsCookieName

  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${cookieName}=`))
    ?.split('=')[1]

  try {
    return cookieValue ? JSON.parse(decodeURIComponent(cookieValue)) : {}
  } catch (e) {
    console.error('Error parsing cookie:', e)

    return {}
  }
}

// Client-side version of getMode
export const getMode = () => {
  const settingsCookie = getSettingsFromCookie()

  return settingsCookie.mode || themeConfig.mode
}
