import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateSecureCode, sanitizeForLogging } from '@/lib/encryption'
import { sanitizeUserData } from '@/lib/privacy'

// GET - Get or generate user's sharing code
export async function GET(request: NextRequest) {
  console.log('=== SHARING CODE API CALLED ===')
  try {
    const userId = request.headers.get('x-user-id')
    console.log('Sharing code GET - userId:', userId)
    
    if (!userId) {
      console.log('No userId in headers')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, sharingCode: true }
    })

    console.log('Found user:', user)

    if (!user) {
      console.log('User not found')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If user doesn't have a sharing code, generate one
    if (!user.sharingCode) {
      console.log('User has no sharing code, generating one')
      let code = generateSecureCode()
      
      // Ensure the code is unique
      while (await prisma.user.findUnique({ where: { sharingCode: code } })) {
        console.log('Code already exists, generating new one')
        code = generateSecureCode()
      }

      console.log('Generated code:', code)
      user = await prisma.user.update({
        where: { id: userId },
        data: { sharingCode: code },
        select: { id: true, name: true, sharingCode: true }
      })
      console.log('Updated user:', user)
    }

    console.log('Returning sharing code:', user.sharingCode)
    return NextResponse.json({ 
      code: user.sharingCode,
      note: 'Sharing codes rotate every 5 minutes for security'
    })
  } catch (error) {
    console.error('Error in GET /api/sharing-code:', sanitizeForLogging(error))
    return NextResponse.json({ error: 'Failed to load sharing code' }, { status: 500 })
  }
}

// POST - Use someone's sharing code to connect
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Sharing code is required' },
        { status: 400 }
      )
    }

    // Find the user with this sharing code
    const codeOwner = await prisma.user.findUnique({
      where: { sharingCode: code.toUpperCase() },
      select: { id: true, name: true, email: true }
    })

    if (!codeOwner) {
      return NextResponse.json(
        { error: 'Invalid sharing code' },
        { status: 404 }
      )
    }

    // Check if user is trying to add themselves
    if (codeOwner.id === userId) {
      return NextResponse.json(
        { error: 'You cannot add yourself' },
        { status: 400 }
      )
    }

    // Check if connection already exists
    const existingConnection = await prisma.workerBoss.findFirst({
      where: {
        OR: [
          { workerId: codeOwner.id, bossId: userId },
          { workerId: userId, bossId: codeOwner.id }
        ]
      }
    })

    if (existingConnection) {
      return NextResponse.json(
        { error: 'You are already connected with this person' },
        { status: 400 }
      )
    }

    // Create the connection (code owner shares their time with code user)
    await prisma.workerBoss.create({
      data: {
        workerId: codeOwner.id, // Person who owns the code shares their time
        bossId: userId          // Person who entered the code can view the time
      }
    })

    return NextResponse.json({
      message: `Successfully connected! You can now view ${codeOwner.name}'s work hours.`,
      connectedUser: sanitizeUserData(codeOwner)
    })
  } catch (error) {
    console.error('Use sharing code error:', sanitizeForLogging(error))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
