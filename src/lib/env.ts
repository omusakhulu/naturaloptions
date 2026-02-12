/**
 * Environment Variable Validation Module
 *
 * This module validates all environment variables at startup using Zod v4.
 * It ensures type safety and prevents runtime errors from missing/invalid env vars.
 *
 * @module env
 *
 * Required variables (app will not start without these):
 * - DATABASE_URL: PostgreSQL connection string
 * - NEXTAUTH_SECRET: Secret for NextAuth.js session encryption (min 16 chars)
 * - NEXTAUTH_URL: Public URL of the application
 *
 * Optional variables (validated if present):
 * - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: Google OAuth credentials
 * - WOO_STORE_URL, WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET: WooCommerce API credentials
 * - SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN: Sentry error tracking
 * - NODE_ENV: Environment mode (defaults to 'development')
 * - PORT: Server port (defaults to 3000)
 * - LOG_LEVEL: Winston log level (defaults to 'info')
 *
 * @example
 * ```typescript
 * import { env } from '@/lib/env'
 *
 * // All values are validated and typed
 * const dbUrl = env.DATABASE_URL // string
 * const port = env.PORT // number
 * const googleId = env.GOOGLE_CLIENT_ID // string | undefined
 * ```
 *
 * Test Environment Behavior:
 * - When NODE_ENV='test' or VITEST=true, returns mock values
 * - Prevents unit tests from requiring real environment variables
 * - Mock values satisfy all validation rules
 */
import { z } from 'zod'

// Skip validation in test environment to prevent unit tests from requiring real env vars
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

/**
 * Zod schema for environment variable validation.
 * Defines required fields, optional fields, transformations, and validation rules.
 */
const envSchema = z.object({
  // Required variables
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .startsWith('postgresql://', 'DATABASE_URL must be a valid PostgreSQL connection string'),
  NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET must be at least 16 characters long'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),

  // Optional variables — empty strings treated as undefined
  GOOGLE_CLIENT_ID: z.string().min(1).optional().catch(undefined),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional().catch(undefined),
  WOO_STORE_URL: z.string().url().optional().catch(undefined),
  WOO_CONSUMER_KEY: z.string().startsWith('ck_').optional().catch(undefined),
  WOO_CONSUMER_SECRET: z.string().startsWith('cs_').optional().catch(undefined),

  // Optional Sentry variables
  SENTRY_DSN: z.string().url().optional().catch(undefined),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().catch(undefined),

  // Environment configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('3000')
    .transform(val => parseInt(val, 10))
    .pipe(z.number().positive()),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
})

/**
 * TypeScript type for validated environment variables.
 * Use this type to ensure type safety when working with env values.
 *
 * @example
 * ```typescript
 * import type { Env } from '@/lib/env'
 *
 * function configureDatabase(config: Pick<Env, 'DATABASE_URL'>) {
 *   // ...
 * }
 * ```
 */
export type Env = z.infer<typeof envSchema>

/**
 * Validates environment variables at import time.
 *
 * Behavior:
 * - Test Environment: Returns mock values (skips validation)
 * - Development/Production: Validates all vars, exits with error on failure
 *
 * On validation failure:
 * - Logs clear error messages showing which vars failed and why
 * - Calls process.exit(1) to prevent app startup with invalid config
 *
 * @returns {Env} Validated environment object
 * @throws {never} Exits process on validation failure (never returns in error case)
 */
function validateEnv(): Env {
  // In test environment, return mock values
  if (isTestEnv) {
    return {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      NEXTAUTH_SECRET: 'test-secret-min-16-chars',
      NEXTAUTH_URL: 'http://localhost:3000',
      NODE_ENV: 'test' as const,
      PORT: 3000,
      LOG_LEVEL: 'info' as const,
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
      WOO_STORE_URL: undefined,
      WOO_CONSUMER_KEY: undefined,
      WOO_CONSUMER_SECRET: undefined,
      SENTRY_DSN: undefined,
      NEXT_PUBLIC_SENTRY_DSN: undefined
    }
  }

  try {
    const validated = envSchema.parse(process.env)

    return validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\n❌ Environment validation failed:\n')
      error.issues.forEach(err => {
        const path = err.path.join('.')

        console.error(`  - ${path}: ${err.message}`)
      })
      console.error('\n💡 Please check your .env file and ensure all required variables are set correctly.\n')
    } else {
      console.error('❌ Unexpected error during environment validation:', error)
    }

    // Exit the process - environment is not properly configured
    process.exit(1)
  }
}

/**
 * Validated environment variables object.
 *
 * All values are validated at module import time.
 * Use this object throughout the application instead of process.env for type safety.
 *
 * @example
 * ```typescript
 * import { env } from '@/lib/env'
 *
 * // Type-safe access to environment variables
 * prisma = new PrismaClient({
 *   datasources: { db: { url: env.DATABASE_URL } }
 * })
 * ```
 */
export const env = validateEnv()

/**
 * Default export of validated environment object.
 * Identical to named export `env`.
 */
export default env
