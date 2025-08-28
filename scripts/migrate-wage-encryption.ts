/**
 * Data Migration Script: Encrypt Existing Wage Data
 * 
 * This script encrypts all existing hourly wage data in the database.
 * Run this after implementing the encryption system.
 * 
 * WARNING: Make a backup of your database before running this script!
 */

import { PrismaClient } from '@prisma/client'
import { encryptSalary } from '../src/lib/encryption'

const prisma = new PrismaClient()

async function migrateWageData() {
  console.log('🔧 Starting wage data encryption migration...')
  
  try {
    // Get all users with hourly wage data
    const users = await prisma.user.findMany({
      where: {
        hourlyWage: { gt: 0 },
        encryptedWage: null
      }
    })

    console.log(`📊 Found ${users.length} users with wage data to encrypt`)

    let processed = 0
    for (const user of users) {
      try {
        // Encrypt the wage
        const encryptedWage = encryptSalary(user.hourlyWage)
        
        // Update the user record
        await prisma.user.update({
          where: { id: user.id },
          data: {
            encryptedWage,
            // Keep original hourlyWage for backward compatibility during transition
          }
        })
        
        processed++
        console.log(`✅ Encrypted wage for user ${user.id} (${processed}/${users.length})`)
      } catch (error) {
        console.error(`❌ Failed to encrypt wage for user ${user.id}:`, error)
      }
    }

    console.log(`🎉 Migration completed! Encrypted ${processed}/${users.length} wage records`)
    
    // Optionally, you can set hourlyWage to 0 after encryption is verified
    // This step should be done carefully after testing
    console.log('💡 Consider setting hourlyWage to 0 after verifying encryption works correctly')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
if (require.main === module) {
  migrateWageData()
    .then(() => {
      console.log('Migration script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration script failed:', error)
      process.exit(1)
    })
}

export { migrateWageData }
