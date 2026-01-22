import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import SessionProvider from '@/components/providers/SessionProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Natural Options',
    template: 'Natural Options - %s'
  },
  description: 'Admin dashboard for Natural Options'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning={true}>
      <body className={inter.className} suppressHydrationWarning={true}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
