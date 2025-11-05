// Style Imports
import '@/app/globals.css'
import 'react-perfect-scrollbar/dist/css/styles.css'

// Component Imports
import RegisterV2 from '@views/pages/auth/RegisterV2'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'Register - Omnishop Portal',
  description: 'Create your account to get started'
}

const RegisterV2Page = async () => {
  // Vars
  const mode = await getServerMode()

  return <RegisterV2 mode={mode} />
}

export default RegisterV2Page
