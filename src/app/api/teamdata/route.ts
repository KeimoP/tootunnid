import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'No user ID provided' }, { status: 401 });
    }

    const workerBossRelations = await prisma.workerBoss.findMany({
      where: {
        OR: [
          { bossId: userId },
          { workerId: userId }
        ]
      },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
            createdAt: true,
            timeEntries: {
              select: {
                clockIn: true,
                clockOut: true,
                duration: true
              }
            }
          }
        },
        boss: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
            createdAt: true,
            timeEntries: {
              select: {
                clockIn: true,
                clockOut: true,
                duration: true
              }
            }
          }
        }
      }
    });

    const workers = [];
    const bosses = [];

    for (const relation of workerBossRelations) {
      if (relation.bossId === userId) {
        const worker = relation.worker;
        const timeEntries = worker.timeEntries;

        // Calculate total minutes worked
        const totalMinutes = timeEntries.reduce((sum, entry) => {
          if (entry.clockIn && entry.clockOut) {
            return sum + Math.floor((entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60));
          }
          return sum;
        }, 0);

        // Calculate today's minutes
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMinutes = timeEntries
          .filter(entry => entry.clockIn && entry.clockIn >= today)
          .reduce((sum, entry) => {
            if (entry.clockIn && entry.clockOut) {
              return sum + Math.floor((entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60));
            }
            return sum;
          }, 0);

        workers.push({
          id: worker.id,
          name: worker.name,
          email: worker.email,
          profilePicture: worker.profilePicture,
          joinDate: worker.createdAt.toISOString(),
          todayMinutes,
          totalMinutes
        });
      } else if (relation.workerId === userId) {
        const boss = relation.boss;
        const timeEntries = boss.timeEntries;

        // Calculate total minutes worked
        const totalMinutes = timeEntries.reduce((sum, entry) => {
          if (entry.clockIn && entry.clockOut) {
            return sum + Math.floor((entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60));
          }
          return sum;
        }, 0);

        // Calculate today's minutes
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMinutes = timeEntries
          .filter(entry => entry.clockIn && entry.clockIn >= today)
          .reduce((sum, entry) => {
            if (entry.clockIn && entry.clockOut) {
              return sum + Math.floor((entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60));
            }
            return sum;
          }, 0);

        bosses.push({
          id: boss.id,
          name: boss.name,
          email: boss.email,
          profilePicture: boss.profilePicture,
          joinDate: boss.createdAt.toISOString(),
          todayMinutes,
          totalMinutes
        });
      }
    }

    return NextResponse.json({
      workers,
      bosses,
      stats: {
        totalWorkers: workers.length,
        totalBosses: bosses.length,
        totalMinutes: workers.reduce((sum, worker) => sum + worker.totalMinutes, 0) + 
                     bosses.reduce((sum, boss) => sum + boss.totalMinutes, 0)
      }
    });

  } catch (error) {
    console.error('Error in GET /api/teamdata:', error);
    return NextResponse.json({ 
      error: 'Internal server error'
    }, { status: 500 });
  }
}
