import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { checkRateLimit } from '@/lib/rateLimit'
import { checkDuplicateSubmission } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit for profile picture uploads
    const rateLimitResult = await checkRateLimit(userId, 'profileUpdate')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many upload attempts. Please wait before trying again.' },
        { status: 429 }
      )
    }

    // Check for duplicate submission
    if (await checkDuplicateSubmission(userId, 'profile_picture_upload')) {
      return NextResponse.json(
        { error: 'Duplicate upload detected. Please wait before uploading again.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('profilePicture') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'profile-pictures')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      console.log('Upload directory already exists or created')
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExtension}`
    const filePath = join(uploadDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(filePath, buffer)

    // Update user profile with new picture URL
    const profilePictureUrl = `/uploads/profile-pictures/${fileName}`
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        profilePicture: profilePictureUrl 
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true
      }
    })

    return NextResponse.json({
      message: 'Profile picture updated successfully',
      profilePicture: updatedUser.profilePicture,
    })
  } catch (error) {
    console.error('Profile picture upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(userId, 'profileUpdate')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429 }
      )
    }

    // Remove profile picture from user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        profilePicture: null 
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true
      }
    })

    return NextResponse.json({
      message: 'Profile picture removed successfully',
      profilePicture: null,
    })
  } catch (error) {
    console.error('Profile picture deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
