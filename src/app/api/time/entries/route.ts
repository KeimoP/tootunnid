import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import { sanitizeTimeEntry } from '@/lib/privacy'
import { sanitizeForLogging } from '@/lib/encryption'
import { checkRateLimit } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit for time entries requests
    const rateLimitResult = await checkRateLimit(userId, 'general')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const dateFilter = searchParams.get('dateFilter') || 'all'
    const statusFilter = searchParams.get('statusFilter') || 'all'
    const exportFormat = searchParams.get('export') // Check if CSV export is requested

    // Calculate date range based on filter
    let startDate: Date
    const endDate = endOfDay(new Date())

    switch (dateFilter) {
      case 'today':
        startDate = startOfDay(new Date())
        break
      case 'week':
        startDate = startOfDay(subDays(new Date(), 7))
        break
      case 'month':
        startDate = startOfDay(subDays(new Date(), 30))
        break
      case 'all':
      default:
        startDate = startOfDay(subDays(new Date(), days))
        break
    }

    // Build where clause
    const whereClause: Record<string, unknown> = {
      userId,
      clockIn: {
        gte: startDate,
        lte: endDate,
      },
    }

    // Add status filter
    if (statusFilter === 'active') {
      whereClause.clockOut = null
    } else if (statusFilter === 'completed') {
      whereClause.clockOut = { not: null }
    }

    // For CSV export, get all entries without pagination
    const queryOptions = {
      where: whereClause,
      orderBy: {
        clockIn: 'desc' as const,
      },
      ...(exportFormat !== 'csv' && {
        skip: (page - 1) * limit,
        take: limit,
      }),
    }

    // Get time entries
    const timeEntries = await prisma.timeEntry.findMany(queryOptions)

    // If CSV export is requested
    if (exportFormat === 'csv') {
      const csvRows = [
        ['Date', 'Clock In', 'Clock Out', 'Duration (hours)', 'Earnings (€)', 'Status'].join(',')
      ]

      for (const entry of timeEntries) {
        const clockInDate = new Date(entry.clockIn).toLocaleDateString()
        const clockInTime = new Date(entry.clockIn).toLocaleTimeString()
        const clockOutTime = entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : 'Active'
        const duration = entry.duration ? (entry.duration / 60).toFixed(2) : '0'
        const earnings = entry.earnings ? entry.earnings.toFixed(2) : '0.00'
        const status = entry.clockOut ? 'Completed' : 'Active'

        csvRows.push([
          clockInDate,
          clockInTime,
          clockOutTime,
          duration,
          earnings,
          status
        ].join(','))
      }

      const csvContent = csvRows.join('\n')
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=time-entries-${new Date().toISOString().split('T')[0]}.csv`,
        },
      })
    }

    // Get total count for pagination
    const totalEntries = await prisma.timeEntry.count({
      where: whereClause,
    })

    // Calculate summary statistics
    const completedEntries = timeEntries.filter(entry => entry.clockOut !== null)
    const totalMinutes = completedEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const totalEarnings = completedEntries.reduce((sum, entry) => sum + (entry.earnings || 0), 0)

    // Sanitize time entries - user can see their own sensitive data
    const sanitizedEntries = timeEntries.map(entry => 
      sanitizeTimeEntry(entry as Record<string, unknown>, true)
    );

    // Log access without sensitive data
    console.log(`Time entries accessed by user: ${userId}`, {
      count: timeEntries.length,
      dateRange: `${days} days`
    });

    return NextResponse.json({
      timeEntries: sanitizedEntries,
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
    console.error('Get time entries error:', sanitizeForLogging(error))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
