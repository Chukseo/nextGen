import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getFileStream } from '@/lib/storage';
import { canAccessSubmissionFile } from '@/lib/permissions';

export async function GET(
  req: Request,
  { params }: { params: { fileId: string } }
) {
  try {
    const fileId = params.fileId;

    const fileRecord = await prisma.manuscriptFile.findUnique({
      where: { id: fileId },
      include: {
        submission: {
          include: {
            reviewAssignments: true,
          },
        },
      },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: 'File record not found' }, { status: 404 });
    }

    // Check permissions if file is confidential or submission is not published
    if (fileRecord.submission.status !== 'PUBLISHED' || fileRecord.isConfidential) {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ error: 'Authentication required to access private manuscript files.' }, { status: 401 });
      }

      const user = session.user as any;
      const reviewerAssignment = fileRecord.submission.reviewAssignments.find(
        (ra) => ra.reviewerId === user.id
      );

      const hasAccess = canAccessSubmissionFile(
        user,
        {
          authorId: fileRecord.submission.authorId,
          journalId: fileRecord.submission.journalId,
          reviewModel: fileRecord.submission.reviewModel,
          assignedEditorId: fileRecord.submission.assignedEditorId,
        },
        {
          isConfidential: fileRecord.isConfidential,
          fileType: fileRecord.fileType,
        },
        reviewerAssignment
      );

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'You do not have authorization to access this confidential manuscript file.' },
          { status: 403 }
        );
      }
    }

    const { stream, mimeType, fileSize } = await getFileStream(
      fileRecord.storageKey,
      fileRecord.fileType === 'FINAL_TYPESET_PDF' ? 'published-articles' : 'manuscripts-private'
    );

    const headers = new Headers();
    headers.set('Content-Type', mimeType);
    headers.set(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileRecord.originalFileName)}"`
    );
    if (fileSize) {
      headers.set('Content-Length', fileSize.toString());
    }

    // Convert node stream to web stream if necessary
    return new Response(stream as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('File download error:', error);
    return NextResponse.json({ error: error.message || 'File download failed' }, { status: 500 });
  }
}
