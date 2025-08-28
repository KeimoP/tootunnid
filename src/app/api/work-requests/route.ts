import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rateLimit'
import { checkDuplicateSubmission, detectSpamPatterns, sanitizeString } from '@/lib/validation'

const createRequestSchema = z.object({
  toUserId: z.string().min(1, 'User ID is required'),
  message: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit for work requests
    const rateLimitResult = await checkRateLimit(userId, 'teamAction')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many work requests. Please wait before trying again.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { toUserId, message } = createRequestSchema.parse(body)

    // Sanitize message if provided
    const sanitizedMessage = message ? sanitizeString(message) : undefined

    // Check for spam patterns in message
    if (sanitizedMessage && detectSpamPatterns(sanitizedMessage)) {
      return NextResponse.json(
        { error: 'Invalid message content detected.' },
        { status: 400 }
      )
    }

    // Check for duplicate submission
    if (await checkDuplicateSubmission(userId, `work_request_${toUserId}`)) {
      return NextResponse.json(
        { error: 'Duplicate request detected. Please wait before sending another request.' },
        { status: 429 }
      )
    }

    // Find receiver by ID
    const receiver = await prisma.user.findUnique({
      where: { id: toUserId }
    })

    if (!receiver) {
      return NextResponse.json(
        { error: 'User with this email not found' },
        { status: 404 }
      )
    }

    if (receiver.id === userId) {
      return NextResponse.json(
        { error: 'You cannot send a work request to yourself' },
        { status: 400 }
      )
    }

    // Check if request already exists
    const existingRequest = await prisma.workRequest.findFirst({
      where: {
        fromUserId: userId,
        toUserId: receiver.id,
        status: 'PENDING',
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request with this user' },
        { status: 400 }
      )
    }

    // Check if relationship already exists (in either direction)
    const existingRelation = await prisma.workerBoss.findFirst({
      where: {
        OR: [
          { workerId: userId, bossId: receiver.id },
          { workerId: receiver.id, bossId: userId }
        ]
      }
    })

    if (existingRelation) {
      return NextResponse.json(
        { error: 'You already have a connection with this person' },
        { status: 400 }
      )
    }

    // Create work request
    const workRequest = await prisma.workRequest.create({
      data: {
        fromUserId: userId,
        toUserId: receiver.id,
        message: sanitizedMessage || '',
      },
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

    return NextResponse.json({
      message: 'Work request sent successfully',
      workRequest,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Create work request error:', error)
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

    // Get both sent and received requests
    const [sentRequests, receivedRequests] = await Promise.all([
      prisma.workRequest.findMany({
        where: { fromUserId: userId },
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
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.workRequest.findMany({
        where: { toUserId: userId },
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
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    return NextResponse.json({ 
      sent: sentRequests,
      received: receivedRequests 
    })
  } catch (error) {
    console.error('Get work requests error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
