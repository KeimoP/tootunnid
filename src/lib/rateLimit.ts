import { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Different rate limits for different operations
const RATE_LIMITS = {
  // Authentication endpoints
  login: { requests: 5, window: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  register: { requests: 3, window: 60 * 60 * 1000 }, // 3 requests per hour
  
  // Clock operations
  clockAction: { requests: 10, window: 60 * 1000 }, // 10 clock actions per minute
  
  // Time entry modifications
  timeEntryEdit: { requests: 20, window: 5 * 60 * 1000 }, // 20 edits per 5 minutes
  timeEntryDelete: { requests: 10, window: 5 * 60 * 1000 }, // 10 deletes per 5 minutes
  
  // Profile updates
  profileUpdate: { requests: 5, window: 5 * 60 * 1000 }, // 5 profile updates per 5 minutes
  
  // Team operations
  teamAction: { requests: 10, window: 60 * 1000 }, // 10 team actions per minute
  
  // General API calls
  general: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
}

export function getRateLimitKey(request: NextRequest, operation: string): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || request.headers.get('cf-connecting-ip') || 'unknown'
  const userId = request.headers.get('x-user-id') || 'anonymous'
  return `${operation}:${ip}:${userId}`
}

export function checkRateLimit(
  key: string, 
  operation: keyof typeof RATE_LIMITS
): { success: boolean; remaining: number; resetTime: number } {
  const limit = RATE_LIMITS[operation]
  const now = Date.now()
  
  const entry = rateLimitStore.get(key)
  
  if (!entry || now > entry.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limit.window
    })
    
    return {
      success: true,
      remaining: limit.requests - 1,
      resetTime: now + limit.window
    }
  }
  
  if (entry.count >= limit.requests) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }
  
  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)
  
  return {
    success: true,
    remaining: limit.requests - entry.count,
    resetTime: entry.resetTime
  }
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes

export function rateLimitResponse(resetTime: number) {
  const headers = new Headers()
  headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString())
  
  return new Response(
    JSON.stringify({ 
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
    }),
    { 
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
      }
    }
  )
}
