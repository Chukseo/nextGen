import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { depositDOI, generateCrossrefXML, formatDOISuffix } from '@/lib/crossref';
import { isMasterAdmin, isEditor } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const submissionId = params.id;
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        journal: true,
        coAuthors: { orderBy: { authorOrder: 'asc' } },
        publishedArticle: {
          include: {
            issue: { include: { volume: true } },
            references: { orderBy: { orderIndex: 'asc' } },
          },
        },
        doiRecord: {
          include: { depositAttempts: { orderBy: { attemptedAt: 'desc' } } },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const prefix = process.env.CROSSREF_DOI_PREFIX || '10.5555';
    const publishedYear = submission.publishedArticle?.publishedAt?.getFullYear() || new Date().getFullYear();
    const sequence = submission.publishedArticle?.articleNumber || submission.submissionNumber.split('-').pop() || '001';
    const suffix = submission.doiRecord?.suffix || formatDOISuffix(submission.journal.slug, publishedYear, sequence);
    const fullDoi = submission.doiRecord?.doi || `${prefix}/${suffix}`;

    const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resourceUrl = `${siteUrl}/articles/${submission.publishedArticle?.slug || submission.publishedArticle?.id || submission.id}`;

    const previewXml = generateCrossrefXML({
      journalTitle: submission.journal.title,
      journalAbbr: submission.journal.abbreviation,
      printIssn: submission.journal.printIssn,
      onlineIssn: submission.journal.onlineIssn,
      volumeNumber: submission.publishedArticle?.issue?.volume?.volumeNumber || 1,
      issueNumber: submission.publishedArticle?.issue?.issueNumber || 1,
      publicationYear: publishedYear,
      articleTitle: submission.title,
      articleSubtitle: submission.subtitle,
      authors: submission.coAuthors.map((author, index) => ({
        firstName: author.firstName,
        lastName: author.lastName,
        affiliation: author.affiliation,
        orcid: author.orcid,
        isCorresponding: author.isCorresponding,
        sequence: index === 0 ? 'first' : 'additional',
      })),
      doi: fullDoi,
      resourcePublicUrl: resourceUrl,
      abstract: submission.abstract,
      citationList: submission.publishedArticle?.references.map((r) => ({
        orderIndex: r.orderIndex,
        rawText: r.rawText,
        doi: r.doi,
      })),
    });

    return NextResponse.json({
      doiRecord: submission.doiRecord,
      generatedDoi: fullDoi,
      previewXml,
      depositMode: process.env.CROSSREF_DEPOSIT_MODE || 'test',
    });
  } catch (error: any) {
    console.error('Fetch DOI info error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const submissionId = params.id;

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { journal: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (!isMasterAdmin(user) && !isEditor(user, submission.journalId)) {
      return NextResponse.json({ error: 'Unauthorized to trigger DOI registration' }, { status: 403 });
    }

    const result = await depositDOI({
      submissionId,
      userId: user.id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Deposit DOI error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
