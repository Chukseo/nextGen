import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { deleteFile } from '@/lib/storage';

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
    const targetId = params.id;

    // Look up published article by article id or submission id
    const publishedArticle = await prisma.publishedArticle.findFirst({
      where: {
        OR: [
          { id: targetId },
          { submissionId: targetId },
        ],
      },
      include: {
        journal: true,
        issue: { include: { volume: true } },
        submission: true,
      },
    });

    if (!publishedArticle) {
      return NextResponse.json({ error: 'Published article record not found' }, { status: 404 });
    }

    if (!isMasterAdmin(user) && !isEditor(user, publishedArticle.journalId)) {
      return NextResponse.json({ error: 'Unauthorized to unpublish articles for this journal' }, { status: 403 });
    }

    const submissionId = publishedArticle.submissionId;

    // Clean up physical PDF file from storage if present
    if (publishedArticle.pdfStorageKey) {
      await deleteFile(publishedArticle.pdfStorageKey, 'published-articles');
    }

    // Execute atomic unpublish transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete FINAL_TYPESET_PDF manuscript files
      const typesetFiles = await tx.manuscriptFile.findMany({
        where: {
          submissionId,
          fileType: 'FINAL_TYPESET_PDF',
        },
      });

      for (const f of typesetFiles) {
        if (f.storageKey) {
          await deleteFile(f.storageKey, 'published-articles');
        }
      }

      await tx.manuscriptFile.deleteMany({
        where: {
          submissionId,
          fileType: 'FINAL_TYPESET_PDF',
        },
      });

      // 2. Delete PublishedArticle (cascades references and keywords)
      await tx.publishedArticle.delete({
        where: { id: publishedArticle.id },
      });

      // 3. Reset Submission status back to PRODUCTION
      await tx.submission.update({
        where: { id: submissionId },
        data: {
          status: 'PRODUCTION',
          publishedAt: null,
        },
      });

      // 4. Reset DOI status to DRAFT so it can be re-published / re-deposited later
      await tx.dOIRecord.updateMany({
        where: { submissionId },
        data: {
          status: 'DRAFT',
        },
      });
    });

    // Notify author
    if (publishedArticle.submission?.authorId) {
      await createNotification({
        userId: publishedArticle.submission.authorId,
        type: 'STATUS_CHANGE',
        title: `Article Returned to Production: ${publishedArticle.title}`,
        message: `Your article has been unpublished from ${publishedArticle.issue?.title || 'Issue'} and returned to the Production stage for editorial adjustments.`,
        linkUrl: `/dashboard/author`,
      });
    }

    await logAuditEvent({
      userId: user.id,
      action: 'UNPUBLISH_ARTICLE',
      entityType: 'SUBMISSION',
      entityId: submissionId,
      details: {
        publishedArticleId: publishedArticle.id,
        issueId: publishedArticle.issueId,
        title: publishedArticle.title,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Article successfully unpublished and returned to the Production stage. It can now be re-published in any issue.',
    });
  } catch (error: any) {
    console.error('Unpublish article error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
