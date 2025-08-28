import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateDuration, calculateEarnings } from '@/lib/utils'
import { checkRateLimit, getRateLimitKey, rateLimitResponse } from '@/lib/rateLimit'
import { validateTimeEntry, checkDuplicateSubmission } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitKey = getRateLimitKey(request, 'clockAction')
    const rateLimitResult = checkRateLimit(rateLimitKey, 'clockAction')
    
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult.resetTime)
    }

    // Check for duplicate submissions
    if (checkDuplicateSubmission(userId, 'clockIn')) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait.' },
        { status: 429 }
      )
    }

    // Check if user has an active time entry (not clocked out)
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        clockOut: null,
      },
    })

    if (activeEntry) {
      return NextResponse.json(
        { error: 'You are already clocked in' },
        { status: 400 }
      )
    }

    // Create new time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId,
        clockIn: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Clocked in successfully',
      timeEntry,
    })
  } catch (error) {
    console.error('Clock in error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit for clock operations
    const rateLimitResult = await checkRateLimit(userId, 'clockAction')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many clock operations. Please wait before trying again.' },
        { status: 429 }
      )
    }

    // Check for duplicate submission
    if (await checkDuplicateSubmission(userId, 'clock_out')) {
      return NextResponse.json(
        { error: 'Duplicate submission detected. Please wait before clocking out again.' },
        { status: 429 }
      )
    }

    // Find active time entry
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        clockOut: null,
      },
    })

    if (!activeEntry) {
      return NextResponse.json(
        { error: 'You are not clocked in' },
        { status: 400 }
      )
    }

    // Get user's hourly wage
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hourlyWage: true },
    })

    const clockOut = new Date()
    const duration = calculateDuration(activeEntry.clockIn, clockOut)
    const earnings = calculateEarnings(duration, user?.hourlyWage || 0)

    // Update time entry with clock out
    const updatedEntry = await prisma.timeEntry.update({
      where: { id: activeEntry.id },
      data: {
        clockOut,
        duration,
        earnings,
      },
    })

    return NextResponse.json({
      message: 'Clocked out successfully',
      timeEntry: updatedEntry,
    })
  } catch (error) {
    console.error('Clock out error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current active time entry
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        clockOut: null,
      },
    })

    return NextResponse.json({
      activeEntry,
      isClockedIn: !!activeEntry,
    })
  } catch (error) {
    console.error('Get clock status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
