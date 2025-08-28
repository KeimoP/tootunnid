import { NextResponse } from 'next/server'

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Basic security headers for all environments
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Production-only security headers
  if (process.env.NODE_ENV === 'production') {
    // HSTS - Force HTTPS for 1 year
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    
    // Content Security Policy
    const csp = process.env.CSP_HEADER || "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self';"
    response.headers.set('Content-Security-Policy', csp)
    
    // Permissions Policy (formerly Feature Policy)
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  }
  
  return response
}

export function createSecureResponse(body: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init)
  return addSecurityHeaders(response)
}

// Utility for API routes to add security headers
export function secureApiResponse(body: unknown, status: number = 200): NextResponse {
  const response = NextResponse.json(body, { status })
  return addSecurityHeaders(response)
}
