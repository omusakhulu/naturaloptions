// Style Imports
import '@/app/globals.css'
import 'react-perfect-scrollbar/dist/css/styles.css'

// Component Imports
import LoginV2 from '@views/pages/auth/LoginV2'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

const LoginPage = async () => {
  // Vars
  const mode = await getServerMode()

  return <LoginV2 mode={mode} />
}

export default LoginPage
