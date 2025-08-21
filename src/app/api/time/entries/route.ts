import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // Calculate date range
    const startDate = startOfDay(subDays(new Date(), days))
    const endDate = endOfDay(new Date())

    // Get time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId,
        clockIn: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        clockIn: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Get total count for pagination
    const totalEntries = await prisma.timeEntry.count({
      where: {
        userId,
        clockIn: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Calculate summary statistics
    const completedEntries = timeEntries.filter(entry => entry.clockOut !== null)
    const totalMinutes = completedEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const totalEarnings = completedEntries.reduce((sum, entry) => sum + (entry.earnings || 0), 0)

    return NextResponse.json({
      timeEntries,
      pagination: {
        page,
        limit,
        total: totalEntries,
        pages: Math.ceil(totalEntries / limit),
      },
      summary: {
        totalMinutes,
        totalEarnings,
        completedSessions: completedEntries.length,
        totalSessions: timeEntries.length,
      },
    })
  } catch (error) {
    console.error('Get time entries error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
