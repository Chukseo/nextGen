import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { publishArticleToZenodo, getRecord } from '@/lib/zenodo';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user as any;
    const articleId = params.id;

    const article = await prisma.publishedArticle.findFirst({
      where: {
        OR: [{ id: articleId }, { slug: articleId }],
      },
      include: {
        journal: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Published article not found' }, { status: 404 });
    }

    if (!isMasterAdmin(user) && !isEditor(user, article.journalId)) {
      return NextResponse.json({ error: 'Unauthorized to manage Zenodo publishing' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'publish'; // 'publish' | 'republish' | 'sync'

    const force = action === 'republish' || action === 'sync';
    const result = await publishArticleToZenodo(article.id, { force });

    await logAuditEvent({
      userId: user.id,
      action: action === 'republish' ? 'REPUBLISH_ZENODO' : 'PUBLISH_ZENODO',
      entityType: 'DOI',
      entityId: article.id,
      details: {
        action,
        recordId: result.recordId,
        doi: result.doi,
        recordUrl: result.recordUrl,
      },
    });

    return NextResponse.json({
      success: true,
      action,
      result,
      message: `Article successfully processed on Zenodo (${result.doi}).`,
    });
  } catch (error: any) {
    console.error(`Admin Zenodo action error for article ${params.id}:`, error);
    return NextResponse.json(
      { error: error.message || 'Zenodo publishing operation failed' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const article = await prisma.publishedArticle.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
      select: {
        id: true,
        title: true,
        doi: true,
        zenodoRecordId: true,
        zenodoDoi: true,
        zenodoUrl: true,
        zenodoPublishedAt: true,
        zenodoDepositStatus: true,
        zenodoLastError: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    let remoteRecord: any = null;
    if (article.zenodoRecordId) {
      try {
        remoteRecord = await getRecord(article.zenodoRecordId);
      } catch (err: any) {
        console.warn(`Could not fetch remote Zenodo record ${article.zenodoRecordId}:`, err.message);
      }
    }

    return NextResponse.json({
      article,
      remoteRecord,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
