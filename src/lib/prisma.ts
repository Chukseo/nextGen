import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getNormalizedDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Supabase pooler optimization:
  // Port 5432 is session mode (pool limit 15 clients, triggers EMAXCONNSESSION).
  // Port 6543 is transaction mode (designed for serverless / high concurrency).
  if (url.includes('pooler.supabase.com:5432')) {
    url = url.replace(':5432', ':6543');
    const separator = url.includes('?') ? '&' : '?';
    if (!url.includes('pgbouncer=true')) {
      url += `${separator}pgbouncer=true`;
    }
  }

  return url;
}

const dbUrl = getNormalizedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;

export default prisma;

