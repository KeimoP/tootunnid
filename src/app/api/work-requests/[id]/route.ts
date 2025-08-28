import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const respondSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = respondSchema.parse(body)
    const requestId = (await params).id

    // Find the work request
    const workRequest = await prisma.workRequest.findUnique({
      where: { id: requestId },
      include: {
        fromUser: true,
        toUser: true,
      }
    })

    if (!workRequest) {
      return NextResponse.json(
        { error: 'Work request not found' },
        { status: 404 }
      )
    }

    // Check if the current user is the receiver
    if (workRequest.toUserId !== userId) {
      return NextResponse.json(
        { error: 'You are not authorized to respond to this request' },
        { status: 403 }
      )
    }

    // Check if request is still pending
    if (workRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This request has already been responded to' },
        { status: 400 }
      )
    }

    // Update the work request status
    const updatedRequest = await prisma.workRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    })

    // If accepted, create bidirectional worker-boss relationships
    if (status === 'ACCEPTED') {
      // Create bidirectional relationships so both users can see each other's time
      const user1Id = workRequest.fromUserId  // Person who sent the request
      const user2Id = workRequest.toUserId    // Person who received the request

      // Create first relationship: user1 shares time with user2
      await prisma.workerBoss.upsert({
        where: {
          workerId_bossId: {
            workerId: user1Id,
            bossId: user2Id
          }
        },
        update: {}, // Do nothing if exists
        create: {
          workerId: user1Id,
          bossId: user2Id
        }
      })

      // Create second relationship: user2 shares time with user1
      await prisma.workerBoss.upsert({
        where: {
          workerId_bossId: {
            workerId: user2Id,
            bossId: user1Id
          }
        },
        update: {}, // Do nothing if exists
        create: {
          workerId: user2Id,
          bossId: user1Id
        }
      })
    }

    return NextResponse.json({
      message: `Work request ${status.toLowerCase()} successfully`,
      workRequest: updatedRequest,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Respond to work request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
