import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin } from '@/lib/permissions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isMasterAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Unauthorized: Master Admin privilege required' }, { status: 403 });
    }

    const [
      totalJournals,
      totalUsers,
      totalSubmissions,
      awaitingScreening,
      underReview,
      revisionsAwaiting,
      acceptedAwaitingProduction,
      publishedCount,
      doiRegisteredCount,
      doiFailedCount,
      recentAuditEvents,
    ] = await Promise.all([
      prisma.journal.count(),
      prisma.user.count(),
      prisma.submission.count(),
      prisma.submission.count({ where: { status: { in: ['SUBMITTED', 'INITIAL_SCREENING'] } } }),
      prisma.submission.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.submission.count({ where: { status: 'REVISIONS_REQUESTED' } }),
      prisma.submission.count({ where: { status: { in: ['ACCEPTED', 'COPYEDITING', 'PRODUCTION'] } } }),
      prisma.publishedArticle.count(),
      prisma.dOIRecord.count({ where: { status: 'REGISTERED' } }),
      prisma.dOIRecord.count({ where: { status: 'FAILED' } }),
      prisma.auditEvent.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    return NextResponse.json({
      metrics: {
        totalJournals,
        totalUsers,
        totalSubmissions,
        awaitingScreening,
        underReview,
        revisionsAwaiting,
        acceptedAwaitingProduction,
        publishedCount,
        doiRegisteredCount,
        doiFailedCount,
      },
      recentAuditEvents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
