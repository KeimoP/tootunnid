import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get current user to determine their role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get team members based on WorkerBoss relationships
    const workerBossRelations = await prisma.workerBoss.findMany({
      where: {
        OR: [
          { workerId: userId }, // User is a worker, get their bosses
          { bossId: userId }    // User is a boss, get their workers
        ]
      },
      include: {
        worker: {
          include: {
            timeEntries: {
              where: {
                clockOut: { not: null }
              }
            }
          }
        },
        boss: {
          include: {
            timeEntries: {
              where: {
                clockOut: { not: null }
              }
            }
          }
        }
      }
    })

    const workers: any[] = []
    const bosses: any[] = []

    // Process relationships to build team lists
    for (const relation of workerBossRelations) {
      if (relation.bossId === userId) {
        // Current user is the boss, add worker to workers list
        const worker = relation.worker
        const timeEntries = worker.timeEntries

        const totalMinutes = timeEntries.reduce((sum, entry) => {
          if (entry.clockOut && entry.clockIn) {
            const duration = (new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) / (1000 * 60)
            return sum + duration
          }
          return sum
        }, 0)

        const totalEarnings = totalMinutes * (worker.hourlyWage / 60)
        const lastActivity = timeEntries.length > 0 ? timeEntries[timeEntries.length - 1].clockIn : null

        workers.push({
          id: worker.id,
          name: worker.name,
          email: worker.email,
          role: worker.role,
          hourlyWage: worker.hourlyWage,
          createdAt: worker.createdAt,
          timeEntries: {
            totalMinutes: Math.round(totalMinutes),
            totalEarnings: Math.round(totalEarnings * 100) / 100,
            completedSessions: timeEntries.length,
            lastActivity
          }
        })
      } else if (relation.workerId === userId) {
        // Current user is the worker, add boss to bosses list
        const boss = relation.boss
        bosses.push({
          id: boss.id,
          name: boss.name,
          email: boss.email,
          role: boss.role,
          hourlyWage: boss.hourlyWage,
          createdAt: boss.createdAt,
          timeEntries: {
            totalMinutes: 0,
            totalEarnings: 0,
            completedSessions: 0,
            lastActivity: null
          }
        })
      }
    }

    // Calculate stats
    const totalWorkers = workers.length
    const totalBosses = bosses.length
    const totalHoursWorked = workers.reduce((sum, worker) => sum + worker.timeEntries.totalMinutes, 0)
    const totalEarningsPaid = workers.reduce((sum, worker) => sum + worker.timeEntries.totalEarnings, 0)

    const stats = {
      totalWorkers,
      totalBosses,
      totalHoursWorked,
      totalEarningsPaid
    }

    return NextResponse.json({
      workers,
      bosses,
      stats
    })
  } catch (error) {
    console.error('Team members API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
