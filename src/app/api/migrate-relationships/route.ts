import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// This is a one-time migration API to fix existing one-way relationships
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all existing relationships
    const existingRelations = await prisma.workerBoss.findMany({
      select: {
        workerId: true,
        bossId: true
      }
    });

    console.log(`Found ${existingRelations.length} existing relationships`);
    
    let createdCount = 0;
    
    // For each relationship, create the reverse if it doesn't exist
    for (const relation of existingRelations) {
      const reverseExists = await prisma.workerBoss.findUnique({
        where: {
          workerId_bossId: {
            workerId: relation.bossId,
            bossId: relation.workerId
          }
        }
      });

      if (!reverseExists) {
        // Create the reverse relationship
        await prisma.workerBoss.create({
          data: {
            workerId: relation.bossId,
            bossId: relation.workerId
          }
        });
        
        createdCount++;
        console.log(`Created reverse relationship: ${relation.bossId} -> ${relation.workerId}`);
      }
    }

    return NextResponse.json({
      message: `Migration completed. Created ${createdCount} reverse relationships.`,
      totalProcessed: existingRelations.length,
      created: createdCount
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed' 
    }, { status: 500 });
  }
}
