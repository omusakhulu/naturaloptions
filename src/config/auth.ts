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
          // DEBUG: Show server DB connection details
          const maskedDbUrl = (process.env.DATABASE_URL || '').replace(/:\/\/.*@/, '://***@')

          console.log('🔍 AUTH DEBUG: DATABASE_URL =', maskedDbUrl)

          try {
            const dbInfo = await prisma.$queryRawUnsafe<any[]>(
              'select current_database() as db, current_schema() as schema'
            )

            console.log('🔍 AUTH DEBUG: Connected to:', dbInfo?.[0] || dbInfo)
          } catch (e) {
            console.log('🔍 AUTH DEBUG: Failed to fetch DB info:', (e as Error).message)
          }

          const totalUsers = await prisma.user.count()

          console.log('🔍 AUTH DEBUG: Visible user count:', totalUsers)

          console.log('🔍 AUTH DEBUG: Attempting login with:', {
            email: credentials.email,
            passwordLength: credentials.password.length
          })

          // Find user by email
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email.toLowerCase()
            }
          })

          console.log('🔍 AUTH DEBUG: User query result:', user ? {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            active: user.active,
            hasPassword: !!user.password
          } : 'NO USER FOUND')

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
          console.log('🔍 AUTH DEBUG: Comparing password...')
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          console.log('🔍 AUTH DEBUG: Password comparison result:', isPasswordValid)

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
            image: user.image
          }
        } catch (error) {
          console.error('Authentication error:', error)
          throw new Error((error as Error).message || 'Authentication failed. Please try again.')
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
      console.log('Debug: Session callback executed', { token, session });
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
