import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      role?: string

      /** The user's ID */
      id?: string
    } & DefaultSession['user']
  }

  interface User {
    role?: string
    id?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    id?: string
  }
}
