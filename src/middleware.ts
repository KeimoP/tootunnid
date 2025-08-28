import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenEdge } from '@/lib/auth-edge'
import { addSecurityHeaders } from '@/lib/security-headers'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip authentication for public routes
  const publicRoutes = ['/login', '/register', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute) {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  try {
    // Extract token from cookies
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      // Redirect to login for protected pages
      if (!pathname.startsWith('/api/')) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        return addSecurityHeaders(response)
      }
      // Return 401 for API routes
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      return addSecurityHeaders(response)
    }

    // Verify token and extract user ID
    const payload = await verifyTokenEdge(token)
    
    if (!payload || !payload.userId) {
      // Clear invalid token
      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url))
      
      response.cookies.delete('auth-token')
      return addSecurityHeaders(response)
    }

    // Add user ID to request headers for API routes
    if (pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', payload.userId as string)
      
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
      return addSecurityHeaders(response)
    }

    const response = NextResponse.next()
    return addSecurityHeaders(response)

  } catch (error) {
    console.error('Middleware auth error:', error)
    
    // Clear invalid token and redirect/return error
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url))
    
    response.cookies.delete('auth-token')
    return addSecurityHeaders(response)
  }
}

// Configure middleware to run in Node.js runtime instead of Edge Runtime
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
