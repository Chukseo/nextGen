import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { isMasterAdmin, isEditor } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit';
import { uploadFile } from '@/lib/storage';
import { generateAPACitation } from '@/lib/citations';
import { formatDOISuffix } from '@/lib/crossref';
import { generateUniqueArticleSlug } from '@/lib/slug';
import { publishArticleToZenodo } from '@/lib/zenodo';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = session.user as any;

    const formData = await req.formData();
    const journalId = formData.get('journalId') as string;
    const issueId = formData.get('issueId') as string | null;
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string | null;
    const abstract = formData.get('abstract') as string;
    const articleType = (formData.get('articleType') as string) || 'RESEARCH_ARTICLE';
    const discipline = (formData.get('discipline') as string) || null;
    const pageRange = (formData.get('pageRange') as string) || '1-15';
    let articleNumber = formData.get('articleNumber') as string | null;
    const customDoi = formData.get('doi') as string | null;
    const publicationDateStr = formData.get('publicationDate') as string | null;
    const conflictOfInterest = (formData.get('conflictOfInterest') as string) || 'The authors declare that they have no competing financial interests.';
    const fundingInfo = (formData.get('fundingInfo') as string) || 'This research was completed with institutional support.';
    const dataAvailability = (formData.get('dataAvailability') as string) || 'Data and supporting resources are available upon request.';
    const ethicsStatement = (formData.get('ethicsStatement') as string) || 'Not applicable. The study utilized open and non-identifiable scientific datasets.';

    const authorsRaw = formData.get('authors') as string | null;
    const keywordsRaw = formData.get('keywords') as string | null;
    const referencesRaw = formData.get('references') as string | null;
    const file = formData.get('file') as File | null;

    if (!journalId || !title || !abstract) {
      return NextResponse.json(
        { error: 'Journal, article title, and abstract are required fields.' },
        { status: 400 }
      );
    }

    if (!isMasterAdmin(user) && !isEditor(user, journalId)) {
      return NextResponse.json(
        { error: 'Unauthorized to import articles into this journal' },
        { status: 403 }
      );
    }

    const journal = await prisma.journal.findUnique({
      where: { id: journalId },
      include: {
        volumes: { include: { issues: true }, orderBy: { volumeNumber: 'desc' } },
      },
    });

    if (!journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 });
    }

    // Resolve or Auto-create Volume and Issue if necessary
    let targetIssue: any = null;
    const currentYear = new Date().getFullYear();

    if (issueId) {
      targetIssue = await prisma.issue.findUnique({
        where: { id: issueId },
        include: { volume: true },
      });
    }

    if (!targetIssue) {
      // Find latest published or in-progress issue
      targetIssue = await prisma.issue.findFirst({
        where: { journalId },
        include: { volume: true },
        orderBy: [{ year: 'desc' }, { issueNumber: 'desc' }],
      });
    }

    if (!targetIssue) {
      // Initialize Volume 1 and Issue 1 automatically
      let volume = journal.volumes[0];
      if (!volume) {
        volume = await prisma.volume.create({
          data: {
            journalId,
            volumeNumber: 1,
            year: currentYear,
            title: `Volume 1 (${currentYear}): Inaugural Scholarly Research`,
            description: `Inaugural volume of ${journal.title}`,
          },
          include: { issues: true },
        });
      }

      targetIssue = await prisma.issue.create({
        data: {
          journalId,
          volumeId: volume.id,
          issueNumber: 1,
          year: currentYear,
          title: `Inaugural Issue: Advances in ${journal.abbreviation || journal.title}`,
          description: `Premier issue featuring peer-reviewed contributions.`,
          status: 'PUBLISHED',
          publicationDate: new Date(),
          coverImageUrl: journal.coverImageUrl || null,
        },
        include: { volume: true },
      });
    }

    // Parse authors
    let parsedAuthors: any[] = [];
    if (authorsRaw) {
      try {
        parsedAuthors = JSON.parse(authorsRaw);
      } catch {
        // Fallback comma/semicolon separation
        parsedAuthors = authorsRaw.split(';').map((name, idx) => {
          const parts = name.trim().split(' ');
          return {
            firstName: parts[0] || 'Scholar',
            lastName: parts.slice(1).join(' ') || 'Author',
            email: `author${idx + 1}@${journal.slug}.org`,
            affiliation: 'Academic Research Institution',
            isCorresponding: idx === 0,
            authorOrder: idx + 1,
          };
        });
      }
    }

    if (!parsedAuthors || parsedAuthors.length === 0) {
      parsedAuthors = [
        {
          firstName: user.name?.split(' ')[0] || 'Lead',
          lastName: user.name?.split(' ').slice(1).join(' ') || 'Author',
          email: user.email || 'author@nextgen-press.org',
          affiliation: user.affiliation || 'Research Institution',
          isCorresponding: true,
          authorOrder: 1,
        },
      ];
    }

    // Parse keywords
    let parsedKeywords: string[] = [];
    if (keywordsRaw) {
      try {
        parsedKeywords = JSON.parse(keywordsRaw);
      } catch {
        parsedKeywords = keywordsRaw.split(',').map((k) => k.trim()).filter(Boolean);
      }
    }
    if (parsedKeywords.length === 0) {
      parsedKeywords = [journal.abbreviation || 'Research', 'Peer-Reviewed', 'Open Access'];
    }

    // Parse references
    let parsedReferences: string[] = [];
    if (referencesRaw) {
      try {
        parsedReferences = JSON.parse(referencesRaw);
      } catch {
        parsedReferences = referencesRaw.split('\n').map((r) => r.trim()).filter(Boolean);
      }
    }

    // Upload PDF file if provided
    let pdfStorageKey: string | null = null;
    let pdfUrl: string | null = null;

    if (file && file.size > 0) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageKey = `published/${journal.slug}/${targetIssue.year}/${Date.now()}_${safeFileName}`;
      
      const uploadResult = await uploadFile({
        fileBuffer,
        originalFileName: safeFileName,
        mimeType: file.type || 'application/pdf',
        bucketName: 'published-articles',
        customPath: storageKey,
      });
      pdfStorageKey = uploadResult.storageKey;
      pdfUrl = uploadResult.publicUrl || `/storage/${uploadResult.storageKey}`;
    }

    const publishedDate = publicationDateStr ? new Date(publicationDateStr) : new Date();

    // Generate collision-free sequence and DOI
    const subCount = await prisma.submission.count();
    const submissionNumber = `IMP-${targetIssue.year}-${String(subCount + 1).padStart(4, '0')}`;

    if (!articleNumber) {
      const issueArticlesCount = await prisma.publishedArticle.count({
        where: { issueId: targetIssue.id },
      });
      articleNumber = String(issueArticlesCount + 1).padStart(3, '0');
    }

    const prefix = process.env.CROSSREF_DOI_PREFIX || '10.5555';
    let finalSuffix = customDoi?.replace(`${prefix}/`, '') || formatDOISuffix(journal.slug, targetIssue.year, parseInt(articleNumber, 10) || subCount + 1);
    let finalDoi = customDoi || `${prefix}/${finalSuffix}`;

    // Ensure DOI uniqueness
    let existingDoi = await prisma.dOIRecord.findUnique({ where: { doi: finalDoi } });
    let counter = 1;
    while (existingDoi) {
      finalSuffix = formatDOISuffix(journal.slug, targetIssue.year, (parseInt(articleNumber, 10) || subCount + 1) + counter);
      finalDoi = `${prefix}/${finalSuffix}`;
      existingDoi = await prisma.dOIRecord.findUnique({ where: { doi: finalDoi } });
      counter++;
    }

    // Generate APA citation
    const citationString = generateAPACitation({
      authors: parsedAuthors.map((a) => ({ firstName: a.firstName, lastName: a.lastName })),
      year: targetIssue.year,
      title,
      journalTitle: journal.title,
      volumeNumber: targetIssue.volume?.volumeNumber || 1,
      issueNumber: targetIssue.issueNumber,
      doi: finalDoi,
    });

    // Execute atomic import transaction with safe connection timeout
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Create Submission with status PUBLISHED
        const submission = await tx.submission.create({
          data: {
            submissionNumber,
            journalId,
            authorId: user.id,
            articleType: articleType as any,
            title,
            subtitle: subtitle || null,
            abstract,
            discipline: discipline || 'General Academic Research',
            status: 'PUBLISHED',
            reviewModel: 'DOUBLE_ANONYMOUS',
            conflictOfInterest,
            ethicsStatement,
            fundingInfo,
            dataAvailability,
            submittedAt: publishedDate,
            acceptedAt: publishedDate,
            publishedAt: publishedDate,
            coAuthors: {
              create: parsedAuthors.map((a, idx) => ({
                firstName: a.firstName,
                lastName: a.lastName,
                email: a.email || `author${idx + 1}@institution.edu`,
                affiliation: a.affiliation || 'Research Institution',
                country: a.country || 'International',
                orcid: a.orcid || null,
                isCorresponding: Boolean(a.isCorresponding),
                authorOrder: a.authorOrder || idx + 1,
              })),
            },
          },
        });

        // 2. Create ManuscriptFile if PDF uploaded
        if (pdfStorageKey) {
          await tx.manuscriptFile.create({
            data: {
              submissionId: submission.id,
              versionNumber: 1,
              fileType: 'FINAL_TYPESET_PDF',
              originalFileName: file?.name || `${submissionNumber}.pdf`,
              storageKey: pdfStorageKey,
              storageUrl: pdfUrl,
              mimeType: 'application/pdf',
              fileSize: file?.size || 1024 * 1024,
              isConfidential: false,
              uploadedById: user.id,
            },
          });
        }

        // 3. Resolve slug and create PublishedArticle
        const articleSlug = await generateUniqueArticleSlug(title, prisma);
        const publishedArticle = await tx.publishedArticle.create({
          data: {
            slug: articleSlug,
            submissionId: submission.id,
            journalId,
            issueId: targetIssue.id,
            title,
            abstract,
            doi: finalDoi,
            doiStatus: 'REGISTERED',
            articleNumber,
            pageRange,
            pdfStorageKey: pdfStorageKey || `published/${journal.slug}/${targetIssue.year}/${submissionNumber}.pdf`,
            pdfUrl: pdfUrl || `/api/articles/${submission.id}/pdf`,
            license: 'CC BY 4.0',
            citationString,
            publishedAt: publishedDate,
          },
        });

        // 4. Create Keywords (single atomic batch)
        if (parsedKeywords.length > 0) {
          await tx.articleKeyword.createMany({
            data: parsedKeywords.map((kw) => ({
              publishedArticleId: publishedArticle.id,
              keyword: kw,
            })),
          });
        }

        // 5. Create References (single atomic batch, fast & prevents pooler timeout)
        if (parsedReferences.length > 0) {
          await tx.articleReference.createMany({
            data: parsedReferences.map((rawRef, i) => {
              const doiMatch = rawRef.match(/\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/);
              return {
                publishedArticleId: publishedArticle.id,
                orderIndex: i + 1,
                rawText: rawRef,
                doi: doiMatch ? doiMatch[1].replace(/[.,;)]$/, '') : null,
              };
            }),
          });
        }

        // 6. Create DOI Record
        await tx.dOIRecord.create({
          data: {
            submissionId: submission.id,
            doi: finalDoi,
            prefix,
            suffix: finalSuffix,
            agency: 'CROSSREF',
            status: 'REGISTERED',
            depositBatchId: `direct-import-${Date.now()}`,
            responseMessage: 'Directly imported and registered in publisher index.',
            registeredAt: publishedDate,
            lastAttemptAt: publishedDate,
          },
        });

        return { submission, publishedArticle };
      },
      {
        maxWait: 15000, // 15 seconds to acquire pool connection
        timeout: 45000, // 45 seconds for interactive transaction to finish
      }
    );

    // Asynchronously trigger Zenodo deposition in background (non-blocking)
    publishArticleToZenodo(result.publishedArticle.id).catch((err) => {
      console.warn('[Zenodo] Direct import automatic background deposit warning:', err);
    });

    await logAuditEvent({
      userId: user.id,
      action: 'DIRECT_IMPORT_ARTICLE',
      entityType: 'SUBMISSION',
      entityId: result.submission.id,
      details: {
        journalId,
        issueId: targetIssue.id,
        title,
        doi: finalDoi,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Article "${title}" directly imported and published successfully into ${journal.title} (Vol. ${targetIssue.volume?.volumeNumber || 1}, No. ${targetIssue.issueNumber}).`,
      articleId: result.publishedArticle.id,
      articleUrl: `/articles/${result.publishedArticle.slug || result.publishedArticle.id}`,
    });
  } catch (error: any) {
    console.error('Direct article import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
