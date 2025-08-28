import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { withPrivacy, sanitizeUserData, canViewSensitiveData } from '@/lib/privacy'
import { encryptSalary, decryptSalary, sanitizeForLogging } from '@/lib/encryption'
import { checkRateLimit } from '@/lib/rateLimit'
import { checkDuplicateSubmission } from '@/lib/validation'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  hourlyWage: z.number().min(0, 'Hourly wage must be positive').optional(),
})

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit for profile requests
    const rateLimitResult = await checkRateLimit(userId, 'general')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hourlyWage: true,
        encryptedWage: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
        workerRelations: {
          include: {
            boss: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        },
        bossRelations: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Decrypt wage if available
    let actualWage = user.hourlyWage;
    if (user.encryptedWage) {
      try {
        actualWage = decryptSalary(user.encryptedWage);
      } catch (error) {
        console.error('Failed to decrypt wage:', sanitizeForLogging(error));
      }
    }

    // Sanitize the response
    const sanitizedUser = sanitizeUserData({
      ...user,
      hourlyWage: actualWage,
      encryptedWage: undefined // Never send encrypted data to client
    });

    return NextResponse.json({ user: sanitizedUser })
  } catch (error) {
    console.error('Get profile error:', sanitizeForLogging(error))
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

    // Check rate limit for profile updates
    const rateLimitResult = await checkRateLimit(userId, 'profileUpdate')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many update attempts. Please wait before trying again.' },
        { status: 429 }
      )
    }

    // Check for duplicate submission
    if (await checkDuplicateSubmission(userId, 'profile_update')) {
      return NextResponse.json(
        { error: 'Duplicate submission detected. Please wait before updating again.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const updateData = updateProfileSchema.parse(body)

    // Remove undefined values and prepare update data
    const cleanUpdateData: Record<string, unknown> = {};
    
    if (updateData.name !== undefined) {
      cleanUpdateData.name = updateData.name;
    }
    
    if (updateData.hourlyWage !== undefined) {
      // Encrypt the wage before storing
      cleanUpdateData.encryptedWage = encryptSalary(updateData.hourlyWage);
      // Keep legacy field for compatibility
      cleanUpdateData.hourlyWage = updateData.hourlyWage;
    }

    if (Object.keys(cleanUpdateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: cleanUpdateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hourlyWage: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // Sanitize the response
    const sanitizedUser = sanitizeUserData(updatedUser);

    console.log('Profile updated for user:', userId, '- sensitive data protected');

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: sanitizedUser,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Update profile error:', sanitizeForLogging(error))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
