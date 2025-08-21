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

    // Get all users except the current user and those who already have relationships
    const existingRelationships = await prisma.workerBoss.findMany({
      where: {
        OR: [
          { workerId: userId },
          { bossId: userId }
        ]
      },
      select: {
        workerId: true,
        bossId: true
      }
    })

    const existingWorkRequests = await prisma.workRequest.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId }
        ],
        status: { in: ['PENDING', 'ACCEPTED'] }
      },
      select: {
        fromUserId: true,
        toUserId: true
      }
    })

    // Collect user IDs to exclude
    const excludeUserIds = new Set([userId])
    
    existingRelationships.forEach(rel => {
      excludeUserIds.add(rel.workerId)
      excludeUserIds.add(rel.bossId)
    })
    
    existingWorkRequests.forEach(req => {
      excludeUserIds.add(req.fromUserId)
      excludeUserIds.add(req.toUserId)
    })

    const users = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludeUserIds) }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
