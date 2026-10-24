import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('Migrating Zenodo columns on PublishedArticle in PostgreSQL...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "PublishedArticle" ADD COLUMN IF NOT EXISTS "zenodoRecordId" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "PublishedArticle" ADD COLUMN IF NOT EXISTS "zenodoDoi" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "PublishedArticle" ADD COLUMN IF NOT EXISTS "zenodoUrl" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "PublishedArticle" ADD COLUMN IF NOT EXISTS "zenodoPublishedAt" TIMESTAMP(3);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "PublishedArticle" ADD COLUMN IF NOT EXISTS "zenodoDepositStatus" TEXT DEFAULT 'NOT_DEPOSITED';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "PublishedArticle" ADD COLUMN IF NOT EXISTS "zenodoLastError" TEXT;`);
    console.log('Zenodo columns added or verified successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
