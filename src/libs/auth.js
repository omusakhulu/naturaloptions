// OLD AUTH FILE - DISABLED TO PREVENT CONFLICTS
// This file is no longer used - auth configuration moved to /config/auth.ts
// DO NOT USE THIS FILE

/*
// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const authOptions = {
  // Use Prisma adapter with proper error handling
  adapter: process.env.NODE_ENV === 'production' ? PrismaAdapter(prisma) : undefined,
  debug: process.env.NODE_ENV === 'development',

  // Configure authentication providers
  providers: [
    CredentialProvider({
      name: 'Credentials',
      type: 'credentials',
      credentials: {},
      async authorize(credentials) {
        const { email, password } = credentials

        try {
          const res = await fetch(`${process.env.API_URL}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
          })

          const data = await res.json()

          if (res.status === 401) {
            throw new Error(JSON.stringify(data))
          }

          if (res.status === 200) {
            return data
          }

          return null
        } catch (e) {
          console.error('Auth error:', e)
          throw new Error(e.message || 'Authentication failed')
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    })
  ],

  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60 // 24 hours
  },

  // Cookie settings
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      }
    }
  },

  // Custom pages
  pages: {
    signIn: '/login',
    error: '/error'
  },

  // Callbacks
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: user.token,
          refreshToken: user.refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user = token.user || token
        session.accessToken = token.accessToken || token.token
        session.error = token.error
      }

      return session
    }
  },

  // Event handlers
  events: {
    async signIn(message) {
      console.log('User signed in:', message.user?.email)
    },
    async signOut(message) {
      console.log('User signed out:', message.session?.user?.email)
    },
    async error(error) {
      console.error('Auth error:', error)
    }
  }
}

export { authOptions }
*/

// This file is disabled - use /config/auth.ts instead
