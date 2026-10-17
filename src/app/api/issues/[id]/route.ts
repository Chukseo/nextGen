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
    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: {
        journal: true,
        volume: true,
        publishedArticles: {
          include: {
            submission: {
              include: { coAuthors: { orderBy: { authorOrder: 'asc' } } },
            },
          },
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return NextResponse.json({ issue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user as any;
    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: { journal: true },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (!isMasterAdmin(user) && !isEditor(user, issue.journalId)) {
      return NextResponse.json({ error: 'Unauthorized to edit this issue' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      status,
      isCurrent,
      scheduledPublishDate,
      editorialIntroduction,
      issueNumber,
      year,
      coverImageUrl,
    } = body;

    if (isCurrent === true) {
      await prisma.issue.updateMany({
        where: { journalId: issue.journalId },
        data: { isCurrent: false },
      });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(coverImageUrl !== undefined && { coverImageUrl }),
        ...(isCurrent !== undefined && { isCurrent: Boolean(isCurrent) }),
        ...(status && {
          status,
          ...(status === 'PUBLISHED' ? { publicationDate: new Date() } : {}),
        }),
        ...(scheduledPublishDate !== undefined && {
          scheduledPublishDate: scheduledPublishDate ? new Date(scheduledPublishDate) : null,
        }),
        ...(editorialIntroduction !== undefined && { editorialIntroduction }),
        ...(issueNumber && { issueNumber: Number(issueNumber) }),
        ...(year && { year: Number(year) }),
      },
    });

    return NextResponse.json({ success: true, issue: updatedIssue });
  } catch (error: any) {
    console.error('Update issue error:', error);
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
    const issueId = params.id;

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        journal: true,
        publishedArticles: true,
      },
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (!isMasterAdmin(user) && !isEditor(user, issue.journalId)) {
      return NextResponse.json({ error: 'Unauthorized to delete issues for this journal' }, { status: 403 });
    }

    // Execute atomic deletion of issue and return any articles inside to PRODUCTION
    await prisma.$transaction(async (tx) => {
      for (const art of issue.publishedArticles) {
        if (art.pdfStorageKey) {
          await deleteFile(art.pdfStorageKey, 'published-articles');
        }

        // Delete final typeset PDF
        await tx.manuscriptFile.deleteMany({
          where: {
            submissionId: art.submissionId,
            fileType: 'FINAL_TYPESET_PDF',
          },
        });

        // Delete PublishedArticle
        await tx.publishedArticle.delete({
          where: { id: art.id },
        });

        // Return submission to PRODUCTION stage
        await tx.submission.update({
          where: { id: art.submissionId },
          data: {
            status: 'PRODUCTION',
            publishedAt: null,
          },
        });
      }

      // Delete the issue itself
      await tx.issue.delete({
        where: { id: issueId },
      });
    });

    await logAuditEvent({
      userId: user.id,
      action: 'DELETE_ISSUE',
      entityType: 'ISSUE',
      entityId: issueId,
      details: {
        journalId: issue.journalId,
        title: issue.title,
        articlesRevertedCount: issue.publishedArticles.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Issue "${issue.title}" deleted. Any assigned articles have been safely returned to the Production queue.`,
    });
  } catch (error: any) {
    console.error('Delete issue error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
