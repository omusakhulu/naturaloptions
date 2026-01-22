import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// This should log when the middleware file is loaded

// Middleware to enforce authentication on ALL routes
export default async function middleware(request: NextRequest) {
  // Define public/allowed paths
  const pathname = request.nextUrl.pathname
  const isLoginPage = request.nextUrl.pathname === '/login' || 
                     request.nextUrl.pathname === '/en/login' ||
                     request.nextUrl.pathname.startsWith('/en/login/')
  
  const isAuthApi = request.nextUrl.pathname.startsWith('/api/auth')
  
  const isPublicAsset = request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/) ||
                       request.nextUrl.pathname.startsWith('/_next/') ||
                       request.nextUrl.pathname.startsWith('/favicon')

  const isRootPath = request.nextUrl.pathname === '/'

  // Allow public assets and auth API without decoding the auth token
  if (isPublicAsset || isAuthApi) {
    return NextResponse.next()
  }

  // Get token using getToken (works in middleware)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  const isAuthenticated = !!token

  // Handle root path and language roots - redirect to login if not authenticated, dashboard if authenticated
  if (isRootPath || pathname === '/en' || pathname === '/fr' || pathname === '/ar') {
    if (isAuthenticated) {
      const lang = pathname.slice(1) || 'en'
      return NextResponse.redirect(new URL(`/${lang}/apps/ecommerce/dashboard`, request.url))
    } else {
      return NextResponse.redirect(new URL('/en/login', request.url))
    }
  }

  // If not authenticated and trying to access protected route, redirect to login
  if (!isAuthenticated && !isLoginPage) {
    return NextResponse.redirect(new URL('/en/login', request.url))
  }

  // If authenticated and trying to access login page, redirect to dashboard
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/en/apps/ecommerce/dashboard', request.url))
  }

  // Allow the request to continue
  return NextResponse.next()
}

// SIMPLEST POSSIBLE MATCHER - should match EVERYTHING
export const config = {
  matcher: [
    // Skip Next.js internals and common static files
    '/((?!_next/static|_next/image|favicon.ico|favicon.png|robots.txt|sitemap.xml|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|css|js|map|woff|woff2|ttf|eot)$).*)'
  ]
}
