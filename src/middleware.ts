import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// This should log when the middleware file is loaded
//console.log('🚀 MIDDLEWARE FILE LOADED')

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
  const pathnameWithoutBase = basePath && pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || '/'
    : pathname
  
  // Get token using getToken (works in middleware)
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  const isAuthenticated = !!token
  //console.log('Session status:', isAuthenticated ? '✅ Authenticated' : '❌ Unauthenticated')
  
  // Define public/allowed paths
  const isLoginPage = pathnameWithoutBase === '/login' || 
                     pathnameWithoutBase === '/en/login' ||
                     pathnameWithoutBase.startsWith('/en/login/') ||
                     pathnameWithoutBase === '/en/pages/auth/login-v2' ||
                     pathnameWithoutBase.startsWith('/en/pages/auth/login-v2/')
  
  const isAuthApi = pathnameWithoutBase.startsWith('/api/auth')
  const isSearchApi = pathnameWithoutBase.startsWith('/api/global-search')
  
  // Check both pathname and pathnameWithoutBase for static assets
  // This handles cases where basePath may or may not be set at build time
  const isPublicAsset = pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/) ||
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

  // Allow public assets, auth API, and search API
  if (isPublicAsset || isAuthApi || isSearchApi) {
    //console.log('🟢 Allowing public asset or auth API')
    return NextResponse.next()
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
  //console.log('✅ Request allowed to continue')
  return NextResponse.next()
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ]
}
