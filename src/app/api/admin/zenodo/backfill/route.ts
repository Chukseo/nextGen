import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { publishArticleToZenodo } from '@/lib/zenodo';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !isMasterAdmin(session.user as any)) {
      return NextResponse.json({ error: 'Master Admin authority required' }, { status: 403 });
    }

    const articles = await prisma.publishedArticle.findMany({
      where: {
        OR: [
          { zenodoRecordId: null },
          { zenodoDoi: null },
          { zenodoDepositStatus: { not: 'PUBLISHED' } },
        ],
        submission: {
          status: 'PUBLISHED',
        },
      },
      select: { id: true, title: true },
    });

    const results: Array<{ id: string; title: string; success: boolean; doi?: string; error?: string }> = [];

    for (const art of articles) {
      try {
        const res = await publishArticleToZenodo(art.id);
        results.push({ id: art.id, title: art.title, success: true, doi: res.doi });
      } catch (err: any) {
        results.push({ id: art.id, title: art.title, success: false, error: err.message });
      }
    }

    await logAuditEvent({
      userId: (session.user as any).id,
      action: 'BATCH_ZENODO_BACKFILL',
      entityType: 'DOI',
      entityId: 'ALL',
      details: {
        total: articles.length,
        succeeded: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    });

    return NextResponse.json({
      success: true,
      total: articles.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
