// Third-party Imports
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import type { JWT } from 'next-auth/jwt'
import type { Session } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcrypt'

import prisma from '@/lib/prisma'

const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      type: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'email@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email.toLowerCase()
            },
            include: {
              accounts: {
                select: {
                  provider: true
                }
              }
            }
          })

          if (!user) {
            return null
          }

          // Check if user is active
          if (!user.active) {
            throw new Error('Your account has been deactivated. Please contact support.')
          }

          // Check if user has a password (may be OAuth only user)
          if (!user.password) {
            const hasOAuthAccount = Array.isArray((user as any).accounts) && (user as any).accounts.length > 0

            if (hasOAuthAccount) {
              throw new Error('Please login using your social account')
            }

            throw new Error('Password not set for this account. Please use "Forgot password" to set one.')
          }

          // Verify password with bcrypt
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            return null
          }

          // Return user object (password excluded)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image
          }
        } catch (error) {
          const message = (error as Error).message || 'Authentication failed. Please try again.'

          if (
            message === 'Invalid email or password' ||
            message === 'Email and password are required' ||
            message === 'Please login using your social account' ||
            message === 'Password not set for this account. Please use "Forgot password" to set one.' ||
            message === 'Your account has been deactivated. Please contact support.'
          ) {
            console.warn('Authentication failed:', message)
          } else {
            console.error('Authentication error:', error)
          }

          throw new Error(message)
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60 // 24 hours
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }

      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id
      }

      return session
    }
  },
  pages: {
    signIn: '/en/pages/auth/login-v2',
    error: '/en/error'
  },
  secret: process.env.NEXTAUTH_SECRET
}

export { authOptions }
