// OLD AUTH FILE - RENAMED TO PREVENT CONFLICTS
// This file is no longer used - auth configuration moved to /config/auth.ts
// DO NOT USE THIS FILE

/*
import CredentialProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'

// Helper function to refresh access token
async function refreshAccessToken(token) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || process.env.API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.refreshToken}`
      },
      cache: 'no-store'
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw new Error(refreshedTokens.message || 'Failed to refresh token')
    }

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken || token.refreshToken,
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 // 30 days
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)

    return {
      ...token,
      error: 'RefreshAccessTokenError'
    }
  }
}

// Import singleton Prisma client instance
const { prisma } = require('./prisma')

// DISABLED - Use /config/auth.ts instead
/*
export const authOptions = {
  // Use Prisma adapter with proper error handling
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === 'development',

  // Configure authentication providers
  providers: [
    CredentialProvider({
      name: 'Credentials',
      type: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'email@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          console.log('Login attempt with credentials:', credentials?.email)

          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password are required')
          }

          // Find user by email
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email.toLowerCase()
            }
          })

          if (!user) {
            throw new Error('Invalid email or password')
          }

          // Check if user is active
          if (!user.active) {
            throw new Error('Your account has been deactivated. Please contact support.')
          }

          // Check if user has a password (may be OAuth only user)
          if (!user.password) {
            throw new Error('Please login using your social account')
          }

          // Verify password with bcrypt
          const bcrypt = require('bcrypt')
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            throw new Error('Invalid email or password')
          }

          console.log('User authenticated successfully:', user.email)

          // Return user object (password excluded)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            accessToken: 'database-auth-token',
            refreshToken: 'database-refresh-token'
          }
        } catch (error) {
          console.error('Authentication error:', error)
          throw new Error(error.message || 'Authentication failed. Please try again.')
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

  // Debug mode
  debug: process.env.NODE_ENV === 'development',

  // Cookie settings
  useSecureCookies: process.env.NODE_ENV === 'production',
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here',

  // Cookie settings
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax', // Consider 'none' if you need cross-site cookies
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : 'localhost'
      }
    }
  },

  // Custom pages
  pages: {
    signIn: '/en/login',
    error: '/en/error'
  },

  // Callbacks
  callbacks: {
    async signIn({ user, account }) {
      console.log('Sign in callback:', {
        user: user?.email,
        provider: account?.provider
      })

      return true
    },

    async jwt({ token, user, account, trigger, session: jwtSession }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || 'user',
            image: user.image
          },
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 // 30 days
        }
      }

      // Handle session update in client
      if (trigger === 'update' && jwtSession) {
        return { ...token, ...jwtSession.user }
      }

      // Return previous token if the token has not expired yet
      if (Date.now() < token.exp * 1000) {
        return token
      }

      // Token is expired, try to refresh it
      return refreshAccessToken(token)
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.user?.id || token.sub,
          name: token.user?.name || token.name,
          email: token.user?.email || token.email,
          role: token.user?.role || 'user',
          image: token.user?.image || token.picture
        }
        session.accessToken = token.accessToken
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
    },
    async session(message) {
      console.log('Session event:', {
        user: message?.session?.user?.email,
        expires: message?.session?.expires
      })

      return message
    }
  },

  secret: process.env.NEXTAUTH_SECRET,

  // Enable debug logs in development
  logger: {
    error(code, metadata) {
      console.error('Auth error:', { code, ...metadata })
    },
    warn(code) {
      console.warn('Auth warning:', code)
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth debug:', { code, ...metadata })
      }
    }
  }
}
*/

// This file is disabled - use /config/auth.ts instead
