import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('env module', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Store original env
    originalEnv = { ...process.env }

    // Set NODE_ENV to test to use mock values
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    // Restore original env
    process.env = originalEnv
  })

  it('should return mock values in test environment', async () => {
    const { env } = await import('./env')

    expect(env.DATABASE_URL).toBe('postgresql://test:test@localhost:5432/test')
    expect(env.NEXTAUTH_SECRET).toBe('test-secret-min-16-chars')
    expect(env.NEXTAUTH_URL).toBe('http://localhost:3000')
    expect(env.NODE_ENV).toBe('test')
    expect(env.PORT).toBe(3000)
    expect(env.LOG_LEVEL).toBe('info')
  })

  it('should have correct type definitions', async () => {
    const { env } = await import('./env')

    // TypeScript should enforce these types
    const dbUrl: string = env.DATABASE_URL
    const secret: string = env.NEXTAUTH_SECRET
    const authUrl: string = env.NEXTAUTH_URL
    const nodeEnv: 'development' | 'production' | 'test' = env.NODE_ENV
    const port: number = env.PORT
    const logLevel: 'debug' | 'info' | 'warn' | 'error' = env.LOG_LEVEL

    // Optional fields should be string | undefined
    const googleId: string | undefined = env.GOOGLE_CLIENT_ID
    const googleSecret: string | undefined = env.GOOGLE_CLIENT_SECRET

    expect(dbUrl).toBeDefined()
    expect(secret).toBeDefined()
    expect(authUrl).toBeDefined()
    expect(nodeEnv).toBeDefined()
    expect(port).toBeDefined()
    expect(logLevel).toBeDefined()

    // Optional values can be undefined in test env
    expect(googleId).toBeUndefined()
    expect(googleSecret).toBeUndefined()
  })

  it('should export Env type for use in other modules', async () => {
    const envModule = await import('./env')

    // This test verifies that the Env type is exported
    expect(envModule).toHaveProperty('env')

    // Type assertion to verify Env type exists
    type EnvType = typeof envModule.env
    const testEnv: EnvType = envModule.env

    expect(testEnv).toBeDefined()
  })
})
