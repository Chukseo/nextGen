import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Migrating countryViews column on PublishedArticle in PostgreSQL...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "PublishedArticle" ADD COLUMN IF NOT EXISTS "countryViews" TEXT DEFAULT '{}';`);
    console.log('countryViews column successfully added or verified!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
