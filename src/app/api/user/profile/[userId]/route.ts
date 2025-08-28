import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/rateLimit'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit for profile viewing
    const rateLimitResult = await checkRateLimit(userId, 'general')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429 }
      )
    }

    const { userId: targetUserId } = await params
    const currentUserId = userId

    // Check if user is trying to view their own profile (redirect to main profile page)
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: 'Use /api/user/profile for own profile' },
        { status: 400 }
      )
    }

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hourlyWage: true,
        createdAt: true,
        updatedAt: true,
        workerRelations: {
          select: {
            boss: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        bossRelations: {
          select: {
            worker: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if there's a work relationship between the users
    const hasRelationship = await prisma.workerBoss.findFirst({
      where: {
        OR: [
          { bossId: currentUserId, workerId: targetUserId },
          { bossId: targetUserId, workerId: currentUserId }
        ]
      }
    })

    if (!hasRelationship) {
      return NextResponse.json(
        { error: 'No work relationship found. You can only view profiles of your team members.' },
        { status: 403 }
      )
    }

    // Return user data (for now showing all data, privacy settings to be added later)
    return NextResponse.json({ user: targetUser })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
