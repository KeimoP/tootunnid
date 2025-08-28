import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkRateLimit } from '@/lib/rateLimit'
import { checkDuplicateSubmission, validateTimeEntry } from '@/lib/validation'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Get user ID from middleware
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit for time entry edits
    const rateLimitResult = await checkRateLimit(userId, 'timeEntryEdit')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many edit attempts. Please wait before trying again.' },
        { status: 429 }
      )
    }

    // Check for duplicate submission
    if (await checkDuplicateSubmission(userId, `edit_${id}`)) {
      return NextResponse.json(
        { error: 'Duplicate submission detected. Please wait before editing again.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { clockOut } = body

    // Validate the time entry data
    const validation = validateTimeEntry(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    
    if (!clockOut) {
      return NextResponse.json({ error: 'Clock out time is required' }, { status: 400 })
    }

    // Verify the time entry belongs to the user
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id: id },
      include: { user: true }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    if (existingEntry.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Validate that clockOut is after clockIn
    const clockInTime = new Date(existingEntry.clockIn)
    const clockOutTime = new Date(clockOut)

    if (clockOutTime <= clockInTime) {
      return NextResponse.json({ 
        error: 'Clock out time must be after clock in time' 
      }, { status: 400 })
    }

    // Calculate duration in minutes
    const durationMs = clockOutTime.getTime() - clockInTime.getTime()
    const durationMinutes = Math.floor(durationMs / (1000 * 60))

    // Calculate earnings if user has hourly wage
    const earnings = existingEntry.user.hourlyWage 
      ? (durationMinutes / 60) * existingEntry.user.hourlyWage 
      : null

    // Update the time entry
    const updatedEntry = await prisma.timeEntry.update({
      where: { id: id },
      data: {
        clockOut: clockOutTime,
        duration: durationMinutes,
        earnings: earnings
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            hourlyWage: true
          }
        }
      }
    })

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error('Error updating time entry:', error)
    return NextResponse.json({ 
      error: 'Failed to update time entry' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Get user ID from middleware
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit for time entry deletions
    const rateLimitResult = await checkRateLimit(userId, 'timeEntryDelete')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many delete attempts. Please wait before trying again.' },
        { status: 429 }
      )
    }

    // Check for duplicate submission
    if (await checkDuplicateSubmission(userId, `delete_${id}`)) {
      return NextResponse.json(
        { error: 'Duplicate submission detected. Please wait before deleting again.' },
        { status: 429 }
      )
    }

    // Verify the time entry belongs to the user
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id: id }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    if (existingEntry.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the time entry
    await prisma.timeEntry.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Time entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json({ 
      error: 'Failed to delete time entry' 
    }, { status: 500 })
  }
}
