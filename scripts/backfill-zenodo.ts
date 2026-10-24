import prisma from '../src/lib/prisma';
import { publishArticleToZenodo } from '../src/lib/zenodo';

async function backfillZenodo() {
  console.log('====================================================');
  console.log('🚀 NextGen Zenodo Publishing Backfill Pipeline');
  console.log('====================================================');

  try {
    // Find all published articles that do not have a Zenodo record ID or whose deposit is not PUBLISHED
    const articles = await prisma.publishedArticle.findMany({
      where: {
        OR: [
          { zenodoRecordId: null },
          { zenodoDoi: null },
          { zenodoDepositStatus: { not: 'PUBLISHED' } },
        ],
        submission: {
          status: 'PUBLISHED',
        },
      },
      include: {
        journal: { select: { title: true, abbreviation: true } },
        issue: { include: { volume: true } },
      },
      orderBy: { publishedAt: 'asc' },
    });

    console.log(`Found ${articles.length} article(s) eligible for Zenodo backfill.\n`);

    if (articles.length === 0) {
      console.log('✅ All published articles are already deposited on Zenodo with active DOIs.');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < articles.length; i++) {
      const art = articles[i];
      console.log(`[${i + 1}/${articles.length}] Processing "${art.title}" (${art.journal.abbreviation || art.journal.title})...`);

      try {
        const result = await publishArticleToZenodo(art.id);
        console.log(`   ✅ Success!`);
        console.log(`      Record ID:  ${result.recordId}`);
        console.log(`      Zenodo DOI: ${result.doi}`);
        console.log(`      Record URL: ${result.recordUrl}\n`);
        successCount++;
      } catch (err: any) {
        console.error(`   ❌ Failed: ${err.message}\n`);
        failCount++;
      }

      // Small delay between calls to be a courteous API citizen
      if (i < articles.length - 1) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    console.log('====================================================');
    console.log(`🎉 Backfill Complete!`);
    console.log(`   Successfully Published: ${successCount}`);
    console.log(`   Failed:                 ${failCount}`);
    console.log('====================================================');
  } catch (error: any) {
    console.error('Fatal backfill error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillZenodo();
