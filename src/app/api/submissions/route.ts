import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { isMasterAdmin, isEditor } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const AuthorSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid author email is required'),
  affiliation: z.string().min(1, 'Affiliation is required'),
  country: z.string().optional(),
  orcid: z.string().optional(),
  isCorresponding: z.boolean().default(false),
  authorOrder: z.number().int().positive().default(1),
  bio: z.string().optional(),
});

const SubmissionSchema = z.object({
  journalId: z.string().min(1, 'Target journal selection is required'),
  articleType: z.enum([
    'RESEARCH_ARTICLE',
    'REVIEW_ARTICLE',
    'SHORT_COMMUNICATION',
    'TECHNICAL_REPORT',
    'CASE_STUDY',
  ]),
  title: z.string().min(5, 'Article title must be at least 5 characters long'),
  subtitle: z.string().optional(),
  abstract: z.string().min(50, 'Abstract must be at least 50 characters long'),
  discipline: z.string().min(2, 'Discipline category is required'),
  language: z.string().default('en'),
  keywords: z.array(z.string()).min(1, 'Provide at least one keyword'),
  reviewModel: z.enum(['SINGLE_ANONYMOUS', 'DOUBLE_ANONYMOUS', 'OPEN']).default('DOUBLE_ANONYMOUS'),
  conflictOfInterest: z.string().optional(),
  ethicsStatement: z.string().optional(),
  fundingInfo: z.string().optional(),
  dataAvailability: z.string().optional(),
  consentStatement: z.string().optional(),
  acknowledgements: z.string().optional(),
  coverLetter: z.string().optional(),
  declarationsConfirmed: z.boolean().refine((val) => val === true, {
    message: 'You must confirm the submission declarations and publishing ethics statement.',
  }),
  authors: z.array(AuthorSchema).min(1, 'At least one author must be specified'),
  uploadedFileKey: z.string().min(1, 'Manuscript Word document (DOC/DOCX) must be uploaded'),
  uploadedFileName: z.string().min(1),
  uploadedFileSize: z.number().positive(),
  supplementaryFiles: z.array(
    z.object({
      key: z.string(),
      name: z.string(),
      size: z.number(),
    })
  ).optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const journalSlug = searchParams.get('journal');
    const user = session.user as any;

    let whereClause: any = {};

    if (isMasterAdmin(user)) {
      // Master admin can see all
      if (statusFilter) whereClause.status = statusFilter;
      if (journalSlug) whereClause.journal = { slug: journalSlug };
    } else if (isEditor(user)) {
      // Editor sees their journal submissions
      const editorRoles = user.roles.filter((r: any) => r.role === 'EDITOR' || r.role === 'JOURNAL_MANAGER');
      const journalIds = editorRoles.map((r: any) => r.journalId).filter(Boolean);

      if (journalIds.length > 0) {
        whereClause.journalId = { in: journalIds };
      }
      if (statusFilter) whereClause.status = statusFilter;
    } else {
      // Regular author only sees their own
      whereClause.authorId = user.id;
      if (statusFilter) whereClause.status = statusFilter;
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        journal: { select: { title: true, slug: true, abbreviation: true } },
        coAuthors: { orderBy: { authorOrder: 'asc' } },
        files: { orderBy: { createdAt: 'desc' } },
        editorialDecisions: { orderBy: { decidedAt: 'desc' }, take: 1 },
        reviewAssignments: { select: { id: true, status: true, dueDate: true } },
        doiRecord: { select: { doi: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error('Fetch submissions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Please sign in to submit a manuscript.' }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();

    const parsed = SubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify journal exists
    const journal = await prisma.journal.findUnique({
      where: { id: data.journalId },
      include: { editorialBoard: true },
    });

    if (!journal) {
      return NextResponse.json({ error: 'Selected journal does not exist.' }, { status: 404 });
    }

    // Generate unique submission number: NGR-YEAR-XXXX
    const currentYear = new Date().getFullYear();
    const count = await prisma.submission.count();
    const submissionNumber = `NGR-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    // Create submission transaction
    const submission = await prisma.$transaction(async (tx) => {
      const sub = await tx.submission.create({
        data: {
          submissionNumber,
          journalId: data.journalId,
          authorId: user.id,
          articleType: data.articleType,
          title: data.title,
          subtitle: data.subtitle,
          abstract: data.abstract,
          discipline: data.discipline,
          language: data.language,
          status: 'SUBMITTED',
          reviewModel: data.reviewModel,
          conflictOfInterest: data.conflictOfInterest,
          ethicsStatement: data.ethicsStatement,
          fundingInfo: data.fundingInfo,
          dataAvailability: data.dataAvailability,
          consentStatement: data.consentStatement,
          acknowledgements: data.acknowledgements,
          coverLetter: data.coverLetter,
          declarationsConfirmed: true,
          submittedAt: new Date(),
        },
      });

      // Add authors
      for (const author of data.authors) {
        await tx.submissionAuthor.create({
          data: {
            submissionId: sub.id,
            firstName: author.firstName,
            lastName: author.lastName,
            email: author.email,
            affiliation: author.affiliation,
            country: author.country,
            orcid: author.orcid,
            isCorresponding: author.isCorresponding,
            authorOrder: author.authorOrder,
            bio: author.bio,
          },
        });
      }

      // Add primary manuscript DOCX file
      await tx.manuscriptFile.create({
        data: {
          submissionId: sub.id,
          versionNumber: 1,
          fileType: 'MANUSCRIPT_DOCX',
          originalFileName: data.uploadedFileName,
          storageKey: data.uploadedFileKey,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          fileSize: data.uploadedFileSize,
          isConfidential: true,
          uploadedById: user.id,
        },
      });

      // Add supplementary files if present
      if (data.supplementaryFiles && data.supplementaryFiles.length > 0) {
        for (const supp of data.supplementaryFiles) {
          await tx.manuscriptFile.create({
            data: {
              submissionId: sub.id,
              versionNumber: 1,
              fileType: 'SUPPLEMENTARY',
              originalFileName: supp.name,
              storageKey: supp.key,
              mimeType: 'application/octet-stream',
              fileSize: supp.size,
              isConfidential: false,
              uploadedById: user.id,
            },
          });
        }
      }

      // Create initial version record
      await tx.manuscriptVersion.create({
        data: {
          submissionId: sub.id,
          versionNumber: 1,
          title: data.title,
          abstract: data.abstract,
          changeSummary: 'Initial manuscript submission.',
          submittedById: user.id,
        },
      });

      return sub;
    });

    // Notify author
    await createNotification({
      userId: user.id,
      type: 'SUBMISSION_CONFIRMED',
      title: `Submission Received: ${submission.submissionNumber}`,
      message: `Your manuscript "${data.title}" has been successfully submitted to ${journal.title}. It is currently queued for initial editorial desk screening.`,
      linkUrl: `/dashboard/author`,
    });

    // Notify journal editorial team
    for (const boardMember of journal.editorialBoard) {
      await createNotification({
        userId: boardMember.userId,
        type: 'NEW_SUBMISSION_FOR_JOURNAL',
        title: `New Manuscript Submission: ${submission.submissionNumber}`,
        message: `New manuscript "${data.title}" submitted to ${journal.title} requires editorial screening.`,
        linkUrl: `/dashboard/editor`,
      });
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: 'SUBMIT_MANUSCRIPT',
      entityType: 'SUBMISSION',
      entityId: submission.id,
      details: {
        submissionNumber: submission.submissionNumber,
        journalId: journal.id,
        journalTitle: journal.title,
        title: data.title,
        authorsCount: data.authors.length,
      },
    });

    return NextResponse.json({
      success: true,
      submissionNumber: submission.submissionNumber,
      submissionId: submission.id,
      message: 'Manuscript submitted successfully.',
    });
  } catch (error: any) {
    console.error('Submission creation error:', error);
    return NextResponse.json({ error: error.message || 'Submission failed' }, { status: 500 });
  }
}
