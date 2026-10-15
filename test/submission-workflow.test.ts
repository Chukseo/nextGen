import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import { depositDOI } from '../src/lib/crossref';

describe('End-to-End Scholarly Publishing Editorial Workflow', () => {
  let testJournal: any;
  let testAuthor: any;
  let testEditor: any;
  let testReviewer: any;
  let testSubmission: any;
  let testIssue: any;

  beforeAll(async () => {
    // Look up pre-seeded test records
    testJournal = await prisma.journal.findFirst({ where: { slug: 'jstai' } });
    testAuthor = await prisma.user.findFirst({ where: { email: 'author.lewis@research.org' } });
    testEditor = await prisma.user.findFirst({ where: { email: 'editor.chen@nextgen-press.org' } });
    testReviewer = await prisma.user.findFirst({ where: { email: 'reviewer.turing@univ.edu' } });
    testIssue = await prisma.issue.findFirst({ where: { status: 'PUBLISHED' } });
  });

  it('verifies that pre-seeded journals and volumes are correctly structured', () => {
    expect(testJournal).toBeDefined();
    expect(testJournal.slug).toBe('jstai');
    expect(testIssue).toBeDefined();
    expect(testIssue.status).toBe('PUBLISHED');
  });

  it('creates an author submission with co-authors and private manuscript file', async () => {
    testSubmission = await prisma.submission.create({
      data: {
        submissionNumber: `NGR-TEST-${Date.now()}`,
        journalId: testJournal.id,
        authorId: testAuthor.id,
        articleType: 'RESEARCH_ARTICLE',
        title: 'Automated Theorem Proving via Recursive Neural Networks',
        abstract: 'We formalize a recursive tree neural network architecture capable of generating inductive invariants for high-assurance microkernel verification.',
        discipline: 'Computer Science - Formal Methods',
        status: 'SUBMITTED',
        reviewModel: 'DOUBLE_ANONYMOUS',
        coAuthors: {
          create: [
            {
              firstName: 'David',
              lastName: 'Lewis',
              email: testAuthor.email,
              affiliation: 'Stanford University',
              isCorresponding: true,
              authorOrder: 1,
            },
          ],
        },
        files: {
          create: [
            {
              versionNumber: 1,
              fileType: 'MANUSCRIPT_DOCX',
              originalFileName: 'TheoremProving_v1.docx',
              storageKey: 'submissions/test/TheoremProving_v1.docx',
              mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              fileSize: 350000,
              isConfidential: true,
              uploadedById: testAuthor.id,
            },
          ],
        },
      },
      include: { coAuthors: true, files: true },
    });

    expect(testSubmission.id).toBeDefined();
    expect(testSubmission.status).toBe('SUBMITTED');
    expect(testSubmission.coAuthors.length).toBe(1);
    expect(testSubmission.files.length).toBe(1);
  });

  it('assigns an editor and moves submission to UNDER_REVIEW', async () => {
    const updated = await prisma.submission.update({
      where: { id: testSubmission.id },
      data: {
        assignedEditorId: testEditor.id,
        status: 'UNDER_REVIEW',
      },
    });

    expect(updated.assignedEditorId).toBe(testEditor.id);
    expect(updated.status).toBe('UNDER_REVIEW');
  });

  it('dispatches a reviewer assignment and records completed review report', async () => {
    const assignment = await prisma.reviewAssignment.create({
      data: {
        submissionId: testSubmission.id,
        reviewerId: testReviewer.id,
        editorId: testEditor.id,
        status: 'ACCEPTED',
        dueDate: new Date(Date.now() + 21 * 24 * 3600 * 1000),
      },
    });

    expect(assignment.status).toBe('ACCEPTED');

    // Reviewer submits report
    const report = await prisma.reviewReport.create({
      data: {
        reviewAssignmentId: assignment.id,
        recommendation: 'ACCEPT',
        rating: 5,
        commentsForAuthors: 'Rigorous formal proof with solid empirical evaluation.',
        confidentialCommentsForEditors: 'Ready for publication in JSTAI.',
      },
    });

    await prisma.reviewAssignment.update({
      where: { id: assignment.id },
      data: { status: 'COMPLETED', completedDate: new Date() },
    });

    expect(report.recommendation).toBe('ACCEPT');
    expect(report.rating).toBe(5);
  });

  it('records an authorized acceptance decision by the editor', async () => {
    const decision = await prisma.editorialDecision.create({
      data: {
        submissionId: testSubmission.id,
        editorId: testEditor.id,
        decision: 'ACCEPT',
        rationale: 'Reviewer commended formal proof and rigorous evaluation.',
        commentsToAuthor: 'Congratulations, your manuscript has been accepted.',
        versionNumber: 1,
      },
    });

    const acceptedSub = await prisma.submission.update({
      where: { id: testSubmission.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    expect(decision.decision).toBe('ACCEPT');
    expect(acceptedSub.status).toBe('ACCEPTED');
  });

  it('assigns accepted article to an issue and deposits Crossref DOI in test mode', async () => {
    // 1. Publish into issue
    const fullDoi = `10.5555/jstai.2026.test${Date.now()}`;
    const pubArticle = await prisma.publishedArticle.create({
      data: {
        submissionId: testSubmission.id,
        journalId: testJournal.id,
        issueId: testIssue.id,
        title: testSubmission.title,
        abstract: testSubmission.abstract,
        doi: fullDoi,
        doiStatus: 'REGISTERED',
        articleNumber: '099',
        pageRange: '100-115',
        pdfStorageKey: 'published/test.pdf',
        pdfUrl: '/storage/published/test.pdf',
        publishedAt: new Date(),
      },
    });

    await prisma.submission.update({
      where: { id: testSubmission.id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });

    expect(pubArticle.doi).toBe(fullDoi);
    expect(pubArticle.doiStatus).toBe('REGISTERED');

    // 2. Perform validated DOI deposit
    const doiResult = await depositDOI({
      submissionId: testSubmission.id,
      userId: testEditor.id,
    });

    expect(doiResult.success).toBe(true);
    expect(doiResult.doiRecord.status).toBe('REGISTERED');
  });

  afterAll(async () => {
    // Cleanup test submission
    if (testSubmission?.id) {
      await prisma.dOIDepositAttempt.deleteMany({
        where: { doiRecord: { submissionId: testSubmission.id } },
      });
      await prisma.dOIRecord.deleteMany({ where: { submissionId: testSubmission.id } });
      await prisma.publishedArticle.deleteMany({ where: { submissionId: testSubmission.id } });
      await prisma.editorialDecision.deleteMany({ where: { submissionId: testSubmission.id } });
      await prisma.reviewReport.deleteMany({
        where: { reviewAssignment: { submissionId: testSubmission.id } },
      });
      await prisma.reviewAssignment.deleteMany({ where: { submissionId: testSubmission.id } });
      await prisma.manuscriptFile.deleteMany({ where: { submissionId: testSubmission.id } });
      await prisma.submissionAuthor.deleteMany({ where: { submissionId: testSubmission.id } });
      await prisma.submission.delete({ where: { id: testSubmission.id } });
    }
    await prisma.$disconnect();
  });
});
