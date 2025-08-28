import { z } from 'zod'

// Validation schemas for different operations
export const loginSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(1, 'Password is required').max(255)
})

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(255)
})

export const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  hourlyWage: z.number().min(0, 'Hourly wage must be positive').max(1000, 'Hourly wage too high').optional()
})

export const clockOutUpdateSchema = z.object({
  clockOut: z.string().datetime('Invalid datetime format')
})

export const teamRequestSchema = z.object({
  sharingCode: z.string().length(6, 'Sharing code must be 6 characters').regex(/^[A-Z0-9]{6}$/, 'Invalid sharing code format')
})

export const teamActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  requestId: z.string().cuid('Invalid request ID')
})

// Sanitize user input
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000) // Limit length
}

// Validate and sanitize email
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().substring(0, 255)
}

// Check for suspicious patterns
export function detectSpamPatterns(text: string): boolean {
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters (more than 10)
    /[^\w\s@.-]{5,}/, // Too many special characters
    /\b(?:viagra|casino|lottery|winner|congratulations|urgent|act now|limited time)\b/i,
    /\b\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/, // Credit card patterns
    /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/, // SSN patterns
  ]
  
  return spamPatterns.some(pattern => pattern.test(text))
}

// Validate time entry data
export function validateTimeEntry(clockIn: string, clockOut?: string): { valid: boolean; error?: string } {
  const clockInDate = new Date(clockIn)
  const now = new Date()
  
  // Check if clock in is not too far in the future
  if (clockInDate.getTime() > now.getTime() + 60000) { // 1 minute tolerance
    return { valid: false, error: 'Clock in time cannot be in the future' }
  }
  
  // Check if clock in is not too far in the past (more than 7 days)
  if (clockInDate.getTime() < now.getTime() - (7 * 24 * 60 * 60 * 1000)) {
    return { valid: false, error: 'Clock in time cannot be more than 7 days ago' }
  }
  
  if (clockOut) {
    const clockOutDate = new Date(clockOut)
    
    // Check if clock out is after clock in
    if (clockOutDate <= clockInDate) {
      return { valid: false, error: 'Clock out time must be after clock in time' }
    }
    
    // Check if session is not longer than 24 hours
    const durationHours = (clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60 * 60)
    if (durationHours > 24) {
      return { valid: false, error: 'Work session cannot be longer than 24 hours' }
    }
    
    // Check if clock out is not too far in the future
    if (clockOutDate.getTime() > now.getTime() + 60000) { // 1 minute tolerance
      return { valid: false, error: 'Clock out time cannot be in the future' }
    }
  }
  
  return { valid: true }
}

// Check for duplicate submissions within a short time frame
const recentSubmissions = new Map<string, number>()

export function checkDuplicateSubmission(userId: string, operation: string): boolean {
  const key = `${userId}:${operation}`
  const lastSubmission = recentSubmissions.get(key)
  const now = Date.now()
  
  if (lastSubmission && now - lastSubmission < 2000) { // 2 seconds minimum between same operations
    return true // Is duplicate
  }
  
  recentSubmissions.set(key, now)
  
  // Clean up old entries
  setTimeout(() => {
    recentSubmissions.delete(key)
  }, 10000) // Keep for 10 seconds
  
  return false // Not duplicate
}

export type ValidationResult = {
  success: boolean
  data?: unknown
  error?: string
}
