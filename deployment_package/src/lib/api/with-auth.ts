import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/config/auth'
import logger from '@/lib/logger'
import { AppError, AuthError, ValidationError } from './errors'

type SimpleHandler = (req: NextRequest, ctx: { session: any; params?: any }) => Promise<NextResponse>

/**
 * Simple auth wrapper — adds session check, try/catch, and logging.
 * Use this as a drop-in replacement for existing route handlers.
 */
export function withAuth(handler: SimpleHandler) {
  return async (req: NextRequest, routeContext?: { params?: Promise<Record<string, string>> }) => {
    const startTime = Date.now()

    try {
      const session = await getServerSession(authOptions)

      if (!session) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }

      // Next.js 15 makes params a Promise
      const params = routeContext?.params ? await routeContext.params : undefined

      return await handler(req, { session, params })
    } catch (error) {
      const duration = Date.now() - startTime
      const message = error instanceof Error ? error.message : 'Internal server error'

      if (error instanceof AppError) {
        if (error.statusCode >= 500) {
          logger.error('API server error', {
            method: req.method,
            url: req.url,
            error: message,
            code: error.code,
            stack: error.stack,
            duration
          })
        }

        const responseBody: any = { success: false, error: message, code: error.code }

        if (error instanceof ValidationError && Object.keys(error.details).length) {
          responseBody.details = error.details
        }

        return NextResponse.json(responseBody, { status: error.statusCode })
      }

      logger.error('Unhandled API error', {
        method: req.method,
        url: req.url,
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
        duration
      })

      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
  }
}

/**
 * Full-featured handler factory with optional Zod validation.
 * Use for new routes that benefit from body/query schema validation.
 */
interface RouteConfig<TBody = unknown, TQuery = unknown> {
  auth?: boolean
  bodySchema?: { safeParse: (data: unknown) => { success: boolean; data?: TBody; error?: any } }
  querySchema?: { safeParse: (data: unknown) => { success: boolean; data?: TQuery; error?: any } }
}

type FullHandler<TBody, TQuery> = (
  req: NextRequest,
  ctx: { session: any | null; params?: Record<string, string>; body: TBody; query: TQuery }
) => Promise<NextResponse>

export function createHandler<TBody = unknown, TQuery = unknown>(
  config: RouteConfig<TBody, TQuery>,
  handler: FullHandler<TBody, TQuery>
) {
  return async (req: NextRequest, routeContext?: { params?: Promise<Record<string, string>> }) => {
    const startTime = Date.now()

    try {
      // Auth
      let session = null

      if (config.auth !== false) {
        session = await getServerSession(authOptions)
        if (!session) throw new AuthError()
      }

      // Parse body
      let body = {} as TBody

      if (config.bodySchema && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const raw = await req.json().catch(() => ({}))
        const result = config.bodySchema.safeParse(raw)

        if (!result.success) {
          const details: Record<string, string[]> = {}

          result.error?.issues?.forEach((issue: any) => {
            const path = issue.path.join('.')

            details[path] = details[path] || []
            details[path].push(issue.message)
          })
          throw new ValidationError('Validation failed', details)
        }

        body = result.data as TBody
      }

      // Parse query
      let query = {} as TQuery

      if (config.querySchema) {
        const searchParams = Object.fromEntries(new URL(req.url).searchParams)
        const result = config.querySchema.safeParse(searchParams)

        if (!result.success) {
          throw new ValidationError('Invalid query parameters')
        }

        query = result.data as TQuery
      }

      // Resolve params
      const params = routeContext?.params ? await routeContext.params : undefined

      const response = await handler(req, { session, params, body, query })

      logger.debug('API response', {
        method: req.method,
        url: req.url,
        status: response.status,
        duration: Date.now() - startTime
      })

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      if (error instanceof AppError) {
        if (error.statusCode >= 500) {
          logger.error('API server error', {
            method: req.method,
            url: req.url,
            error: error.message,
            code: error.code,
            stack: error.stack,
            duration
          })
        }

        const responseBody: any = { success: false, error: error.message, code: error.code }

        if (error instanceof ValidationError && Object.keys(error.details).length) {
          responseBody.details = error.details
        }

        return NextResponse.json(responseBody, { status: error.statusCode })
      }

      const message = error instanceof Error ? error.message : 'Internal server error'

      logger.error('Unhandled API error', {
        method: req.method,
        url: req.url,
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
        duration
      })

      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
  }
}
