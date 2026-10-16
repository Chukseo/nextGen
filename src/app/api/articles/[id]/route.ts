import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { deleteFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const article = await prisma.publishedArticle.findFirst({
      where: {
        OR: [
          { id: params.id },
          { submissionId: params.id },
        ],
      },
      include: {
        journal: true,
        issue: { include: { volume: true } },
        submission: {
          include: {
            coAuthors: { orderBy: { authorOrder: 'asc' } },
            files: true,
          },
        },
        references: { orderBy: { orderIndex: 'asc' } },
        keywords: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(req.url);
    const deleteSubmission = searchParams.get('deleteSubmission') === 'true';

    const publishedArticle = await prisma.publishedArticle.findFirst({
      where: {
        OR: [
          { id: targetId },
          { submissionId: targetId },
        ],
      },
      include: {
        journal: true,
        submission: {
          include: { files: true },
        },
      },
    });

    if (!publishedArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (!isMasterAdmin(user) && !isEditor(user, publishedArticle.journalId)) {
      return NextResponse.json({ error: 'Unauthorized to delete articles in this journal' }, { status: 403 });
    }

    const submissionId = publishedArticle.submissionId;

    // Delete PDF file from storage
    if (publishedArticle.pdfStorageKey) {
      await deleteFile(publishedArticle.pdfStorageKey, 'published-articles');
    }

    if (deleteSubmission) {
      // Clean up all submission files from storage
      for (const f of publishedArticle.submission.files) {
        if (f.storageKey) {
          const bucket = f.fileType === 'FINAL_TYPESET_PDF' ? 'published-articles' : 'manuscripts-private';
          await deleteFile(f.storageKey, bucket);
        }
      }

      // Delete the entire submission (cascade deletes versions, reviews, decisions, doi, etc.)
      await prisma.$transaction(async (tx) => {
        await tx.publishedArticle.delete({ where: { id: publishedArticle.id } });
        await tx.manuscriptFile.deleteMany({ where: { submissionId } });
        await tx.manuscriptVersion.deleteMany({ where: { submissionId } });
        await tx.submissionAuthor.deleteMany({ where: { submissionId } });
        await tx.reviewAssignment.deleteMany({ where: { submissionId } });
        await tx.editorialDecision.deleteMany({ where: { submissionId } });
        await tx.dOIRecord.deleteMany({ where: { submissionId } });
        await tx.submission.delete({ where: { id: submissionId } });
      });

      await logAuditEvent({
        userId: user.id,
        action: 'DELETE_ARTICLE_PERMANENT',
        entityType: 'SUBMISSION',
        entityId: submissionId,
        details: { title: publishedArticle.title, deletedSubmission: true },
      });

      return NextResponse.json({
        success: true,
        message: 'Article and entire submission permanently deleted.',
      });
    } else {
      // Delete only the published article record and remove final PDF
      await prisma.$transaction(async (tx) => {
        await tx.manuscriptFile.deleteMany({
          where: { submissionId, fileType: 'FINAL_TYPESET_PDF' },
        });
        await tx.publishedArticle.delete({ where: { id: publishedArticle.id } });
        await tx.submission.update({
          where: { id: submissionId },
          data: { status: 'PRODUCTION', publishedAt: null },
        });
      });

      await logAuditEvent({
        userId: user.id,
        action: 'DELETE_PUBLISHED_ARTICLE',
        entityType: 'SUBMISSION',
        entityId: submissionId,
        details: { title: publishedArticle.title },
      });

      return NextResponse.json({
        success: true,
        message: 'Published article record deleted and manuscript reset to production.',
      });
    }
  } catch (error: any) {
    console.error('Delete article error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
