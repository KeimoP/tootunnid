import { NextRequest, NextResponse } from 'next/server';
import { sanitizeForLogging } from './encryption';

/**
 * Privacy middleware to sanitize responses and logs
 */
export function withPrivacy(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Sanitize request data for logging
      const sanitizedUrl = req.url.replace(/[?&](code|token|key)=[^&]*/g, '$1=***');
      
      console.log(`[${req.method}] ${sanitizedUrl}`);
      
      const response = await handler(req);
      
      // Add privacy headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      return response;
    } catch (error) {
      // Sanitize error for logging
      console.error('[API Error]', sanitizeForLogging(error));
      
      return NextResponse.json(
        { error: 'An error occurred' },
        { status: 500 }
      );
    }
  };
}

/**
 * Sanitize user data before sending to client
 */
export function sanitizeUserData(user: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...user };
  
  // Never send these to client
  delete sanitized.password;
  delete sanitized.encryptedWage;
  
  // Only send hourly wage to the user themselves, never to others
  if (sanitized.hourlyWage && typeof sanitized.hourlyWage === 'number') {
    // This will be handled by the API endpoint based on user authentication
  }
  
  return sanitized;
}

/**
 * Sanitize time entry data
 */
export function sanitizeTimeEntry(entry: Record<string, unknown>, isOwner: boolean = false): Record<string, unknown> {
  const sanitized = { ...entry };
  
  if (!isOwner) {
    // Remove sensitive data when not the owner
    delete sanitized.earnings;
    delete sanitized.duration;
    delete sanitized.hourlyWage;
  }
  
  return sanitized;
}

/**
 * Check if user has permission to view sensitive data
 */
export function canViewSensitiveData(requestingUserId: string, targetUserId: string): boolean {
  return requestingUserId === targetUserId;
}
