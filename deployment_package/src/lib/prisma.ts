import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Configure Prisma with optimized connection pooling
const prismaClientConfig: Prisma.PrismaClientOptions = {
  log: process.env.NODE_ENV === 'development' 
    ? ['query' as const, 'error' as const, 'warn' as const] 
    : ['error' as const],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
}

// Add connection pool configuration via DATABASE_URL query parameters
// Example: mongodb://...?connection_limit=10&pool_timeout=10
// Or for PostgreSQL: postgresql://...?connection_limit=10&pool_timeout=10&connect_timeout=10

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(prismaClientConfig)

// Store instance in development to prevent multiple clients
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Gracefully shutdown Prisma Client on app termination
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

export default prisma
