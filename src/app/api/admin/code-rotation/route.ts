import { NextRequest, NextResponse } from 'next/server'
import { startCodeRotationScheduler } from '@/lib/code-rotation'

// Global variable to store the interval ID
let rotationIntervalId: NodeJS.Timeout | null = null

export async function POST(request: NextRequest) {
  try {
    if (rotationIntervalId) {
      return NextResponse.json({ message: 'Code rotation scheduler is already running' })
    }

    rotationIntervalId = startCodeRotationScheduler()
    
    return NextResponse.json({ 
      message: 'Code rotation scheduler started successfully',
      interval: '5 minutes'
    })
  } catch (error) {
    console.error('Failed to start code rotation scheduler:', error)
    return NextResponse.json(
      { error: 'Failed to start scheduler' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!rotationIntervalId) {
      return NextResponse.json({ message: 'Code rotation scheduler is not running' })
    }

    clearInterval(rotationIntervalId)
    rotationIntervalId = null
    
    return NextResponse.json({ message: 'Code rotation scheduler stopped' })
  } catch (error) {
    console.error('Failed to stop code rotation scheduler:', error)
    return NextResponse.json(
      { error: 'Failed to stop scheduler' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: rotationIntervalId ? 'running' : 'stopped',
    interval: '5 minutes'
  })
}
