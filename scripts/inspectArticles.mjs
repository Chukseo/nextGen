import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const articles = await prisma.publishedArticle.findMany({
    include: {
      journal: true,
      issue: { include: { volume: true } },
      submission: {
        include: {
          coAuthors: true,
          files: true,
        }
      }
    }
  });

  console.log('=== TOTAL PUBLISHED ARTICLES:', articles.length, '===');
  for (const a of articles) {
    console.log({
      id: a.id,
      title: a.title,
      journal: a.journal?.title,
      slug: a.journal?.slug,
      issue: a.issue ? `Vol ${a.issue.volume?.volumeNumber} Iss ${a.issue.issueNumber} (${a.issue.year})` : 'NO ISSUE',
      pdfUrl: a.pdfUrl,
      pdfStorageKey: a.pdfStorageKey,
      submissionStatus: a.submission?.status,
      filesCount: a.submission?.files?.length || 0,
      files: a.submission?.files?.map(f => ({ type: f.fileType, key: f.storageKey, url: f.storageUrl })),
    });
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
