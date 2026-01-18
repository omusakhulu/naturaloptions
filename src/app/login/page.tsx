import { redirect } from 'next/navigation'

import { i18n } from '@/configs/i18n'

export default function LoginPage() {
  redirect(`/${i18n.defaultLocale}/login`)
}
