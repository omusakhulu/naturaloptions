import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getToken } from 'next-auth/jwt'

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://naturaloptions.co.ke https://*.wp.com",
      "font-src 'self' data:",
      "connect-src 'self' https://naturaloptions.co.ke https://sandbox.safaricom.co.ke https://api.safaricom.co.ke",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  )

  return response
}

// Middleware to enforce authentication on ALL routes
export default async function middleware(request: NextRequest) {
  //console.log('🔒 Middleware running for path:', request.nextUrl.pathname)

  const basePath = request.nextUrl.basePath || process.env.BASEPATH || ''

  const withBasePath = (path: string) => {
    if (!basePath) return path
    const joined = `${basePath}${path}`
    const normalized = joined.replace(/\/{2,}/g, '/')

    return normalized || '/'
  }

  const pathname = request.nextUrl.pathname

  const pathnameWithoutBase =
    basePath && pathname.startsWith(basePath) ? pathname.slice(basePath.length) || '/' : pathname

  // Get token using getToken (works in middleware)
  let token = null

  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })
  } catch (error) {
    console.error('Token verification failed:', error)

    // Redirect to login on token verification failure
    const response = NextResponse.redirect(new URL(withBasePath('/en/pages/auth/login-v2'), request.url))

    response.cookies.delete('next-auth.session-token')
    response.cookies.delete('__Secure-next-auth.session-token')

    return addSecurityHeaders(response)
  }

  const isAuthenticated = !!token

  //console.log('Session status:', isAuthenticated ? '✅ Authenticated' : '❌ Unauthenticated')

  // Define public/allowed paths
  const isLoginPage =
    pathnameWithoutBase === '/login' ||
    pathnameWithoutBase === '/en/login' ||
    pathnameWithoutBase.startsWith('/en/login/') ||
    pathnameWithoutBase === '/en/pages/auth/login-v2' ||
    pathnameWithoutBase.startsWith('/en/pages/auth/login-v2/')

  const isAuthApi = pathnameWithoutBase.startsWith('/api/auth')
  const isHealthCheck = pathnameWithoutBase === '/api/health'

  // Check both pathname and pathnameWithoutBase for static assets
  // This handles cases where basePath may or may not be set at build time
  const isPublicAsset =
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/) ||
    pathname.startsWith('/_next/') ||
    pathname.includes('/_next/') ||
    pathnameWithoutBase.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathnameWithoutBase.startsWith('/favicon')

  const isRootPath = pathnameWithoutBase === '/'

  //console.log('Path analysis:', {
  //   path: request.nextUrl.pathname,
  //   isAuthenticated,
  //   isLoginPage,
  //   isAuthApi,
  //   isPublicAsset,
  //   isRootPath
  // })

  // Handle root path and language roots - redirect to login if not authenticated, dashboard if authenticated
  if (isRootPath || pathnameWithoutBase === '/en' || pathnameWithoutBase === '/fr' || pathnameWithoutBase === '/ar') {
    if (isAuthenticated) {
      console.log('🏠 Root/Lang path: Redirecting authenticated user to dashboard')
      const lang = pathnameWithoutBase.slice(1) || 'en'

      return NextResponse.redirect(new URL(withBasePath(`/${lang}/apps/ecommerce/dashboard`), request.url))
    } else {
      console.log('🏠 Root/Lang path: Redirecting unauthenticated user to login')

      return NextResponse.redirect(new URL(withBasePath('/en/pages/auth/login-v2'), request.url))
    }
  }

  // Allow public assets, auth API, and health check
  if (isPublicAsset || isAuthApi || isHealthCheck) {
    return addSecurityHeaders(NextResponse.next())
  }

  // If not authenticated and trying to access protected route, redirect to login
  if (!isAuthenticated && !isLoginPage) {
    //console.log('🚫 Unauthenticated user trying to access protected route, redirecting to login')
    return NextResponse.redirect(new URL(withBasePath('/en/pages/auth/login-v2'), request.url))
  }

  // If authenticated and trying to access login page, redirect to dashboard
  if (isAuthenticated && isLoginPage) {
    //console.log('🔄 Authenticated user on login page, redirecting to dashboard')
    return NextResponse.redirect(new URL(withBasePath('/en/apps/ecommerce/dashboard'), request.url))
  }

  // Allow the request to continue
  return addSecurityHeaders(NextResponse.next())
}

// Exclude static files and Next.js internals from middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)'
  ]
}
