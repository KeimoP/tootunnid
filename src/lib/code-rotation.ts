import { prisma } from '@/lib/db'
import { generateSecureCode } from '@/lib/encryption'

// Rotate all sharing codes
export async function rotateAllSharingCodes(): Promise<void> {
  try {
    console.log('🔄 Starting sharing code rotation...')
    
    // Get all users who have sharing codes
    const usersWithCodes = await prisma.user.findMany({
      where: {
        sharingCode: { not: null }
      },
      select: {
        id: true,
        name: true,
        sharingCode: true
      }
    })

    console.log(`📋 Found ${usersWithCodes.length} users with sharing codes`)

    if (usersWithCodes.length === 0) {
      console.log('✅ No users with sharing codes to rotate')
      return
    }

    // Generate new unique codes for all users
    const newCodes: { userId: string, code: string }[] = []
    const usedCodes = new Set<string>()

    for (const user of usersWithCodes) {
      let newCode: string
      let attempts = 0
      const maxAttempts = 100

      // Generate a unique code
      do {
        newCode = generateSecureCode()
        attempts++
        if (attempts > maxAttempts) {
          throw new Error('Failed to generate unique code after maximum attempts')
        }
      } while (usedCodes.has(newCode))

      usedCodes.add(newCode)
      newCodes.push({ userId: user.id, code: newCode })
      
      console.log(`🔑 Generated new code for ${user.name}: ${user.sharingCode} → ${newCode}`)
    }

    // Update all users with their new codes in a transaction
    await prisma.$transaction(
      newCodes.map(({ userId, code }) =>
        prisma.user.update({
          where: { id: userId },
          data: { sharingCode: code }
        })
      )
    )

    console.log(`✅ Successfully rotated ${newCodes.length} sharing codes`)
  } catch (error) {
    console.error('❌ Error rotating sharing codes:', error)
    throw error
  }
}

// Start the code rotation scheduler
export function startCodeRotationScheduler(): NodeJS.Timeout {
  console.log('🚀 Starting sharing code rotation scheduler (every 5 minutes)')
  
  // Run immediately on startup
  rotateAllSharingCodes().catch(console.error)
  
  // Then run every 5 minutes (300,000 milliseconds)
  return setInterval(async () => {
    try {
      await rotateAllSharingCodes()
    } catch (error) {
      console.error('Scheduled code rotation failed:', error)
    }
  }, 5 * 60 * 1000) // 5 minutes
}

// Stop the scheduler
export function stopCodeRotationScheduler(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId)
  console.log('🛑 Stopped sharing code rotation scheduler')
}
