import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'
import { z } from 'zod'
import { checkRateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/rateLimit'
import { sanitizeEmail, detectSpamPatterns, checkDuplicateSubmission } from '@/lib/validation'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request, 'login')
    const rateLimitResult = checkRateLimit(rateLimitKey, 'login')
    
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult.resetTime)
    }

    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Sanitize and validate input
    const sanitizedEmail = sanitizeEmail(email)
    
    // Check for spam patterns
    if (detectSpamPatterns(email) || detectSpamPatterns(password)) {
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      )
    }

    // Check for duplicate submissions
    if (checkDuplicateSubmission('anonymous', 'login')) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait.' },
        { status: 429 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 400 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 400 }
      )
    }

    // Generate JWT token
    const token = generateToken(user.id)

    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hourlyWage: user.hourlyWage,
      createdAt: user.createdAt,
    }

    const response = NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    })

    // Set HTTP-only cookie with proper security settings
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure only in production
      sameSite: 'strict', // Changed to strict for better security
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    console.log('Login successful for user:', user.email)
    console.log('Setting cookie with token:', token.substring(0, 20) + '...')
    console.log('Cookie settings:', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })
    
    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
