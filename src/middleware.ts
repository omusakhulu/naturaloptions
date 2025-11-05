import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// This should log when the middleware file is loaded
console.log('🚀 MIDDLEWARE FILE LOADED')

// Middleware to enforce authentication on ALL routes
export default async function middleware(request: NextRequest) {
  console.log('🔒 Middleware running for path:', request.nextUrl.pathname)
  
  // Get token using getToken (works in middleware)
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  const isAuthenticated = !!token
  console.log('Session status:', isAuthenticated ? '✅ Authenticated' : '❌ Unauthenticated')
  
  // Define public/allowed paths
  const isLoginPage = request.nextUrl.pathname === '/login' || 
                     request.nextUrl.pathname === '/en/login' ||
                     request.nextUrl.pathname.startsWith('/en/login/') ||
                     request.nextUrl.pathname === '/en/pages/auth/login-v2' ||
                     request.nextUrl.pathname.startsWith('/en/pages/auth/login-v2/')
  
  const isAuthApi = request.nextUrl.pathname.startsWith('/api/auth')
  
  const isPublicAsset = request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/) ||
                       request.nextUrl.pathname.startsWith('/_next/') ||
                       request.nextUrl.pathname.startsWith('/favicon')

  const isRootPath = request.nextUrl.pathname === '/'

  console.log('Path analysis:', {
    path: request.nextUrl.pathname,
    isAuthenticated,
    isLoginPage,
    isAuthApi,
    isPublicAsset,
    isRootPath
  })

  // Handle root path and language roots - redirect to login if not authenticated, dashboard if authenticated
  if (isRootPath || request.nextUrl.pathname === '/en' || request.nextUrl.pathname === '/fr' || request.nextUrl.pathname === '/ar') {
    if (isAuthenticated) {
      console.log('🏠 Root/Lang path: Redirecting authenticated user to dashboard')
      const lang = request.nextUrl.pathname.slice(1) || 'en'
      return NextResponse.redirect(new URL(`/${lang}/apps/ecommerce/dashboard`, request.url))
    } else {
      console.log('🏠 Root/Lang path: Redirecting unauthenticated user to login')
      return NextResponse.redirect(new URL('/en/pages/auth/login-v2', request.url))
    }
  }

  // Allow public assets and auth API
  if (isPublicAsset || isAuthApi) {
    console.log('🟢 Allowing public asset or auth API')
    return NextResponse.next()
  }

  // If not authenticated and trying to access protected route, redirect to login
  if (!isAuthenticated && !isLoginPage) {
    console.log('🚫 Unauthenticated user trying to access protected route, redirecting to login')
    return NextResponse.redirect(new URL('/en/pages/auth/login-v2', request.url))
  }

  // If authenticated and trying to access login page, redirect to dashboard
  if (isAuthenticated && isLoginPage) {
    console.log('🔄 Authenticated user on login page, redirecting to dashboard')
    return NextResponse.redirect(new URL('/en/dashboard', request.url))
  }

  // Allow the request to continue
  console.log('✅ Request allowed to continue')
  return NextResponse.next()
}

// SIMPLEST POSSIBLE MATCHER - should match EVERYTHING
export const config = {
  matcher: '/:path*'
}
