import { PrismaClient } from '@prisma/client';

/**
 * Constructs the canonical database connection URL:
 * 1. Checks standard environment variables (DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL, DIRECT_URL)
 * 2. In AI Studio / local development, constructs socket or TCP URL from SQL_* credentials
 */
export function getDatabaseUrl(): string | undefined {
  const envUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DIRECT_URL;

  if (envUrl && envUrl.trim() !== '') {
    const trimmed = envUrl.trim();
    if (!trimmed.includes('connection_limit=')) {
      const sep = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${sep}connection_limit=15&pool_timeout=20&connect_timeout=15`;
    }
    return trimmed;
  }

  // AI Studio / GCP Cloud SQL socket or host fallback
  if (process.env.SQL_USER && process.env.SQL_DB_NAME) {
    const user = encodeURIComponent(process.env.SQL_USER);
    const pass = encodeURIComponent(process.env.SQL_PASSWORD || '');
    const host = encodeURIComponent(process.env.SQL_HOST || 'localhost');
    const db = process.env.SQL_DB_NAME;
    const port = process.env.SQL_PORT || '5432';

    if (process.env.SQL_HOST && (process.env.SQL_HOST.startsWith('/') || process.env.SQL_HOST.includes(':'))) {
      // Unix domain socket connection
      return `postgresql://${user}:${pass}@localhost/${db}?host=${host}&connection_limit=15&pool_timeout=20&connect_timeout=15`;
    }

    return `postgresql://${user}:${pass}@${process.env.SQL_HOST || 'localhost'}:${port}/${db}?connection_limit=15&pool_timeout=20&connect_timeout=15`;
  }

  return undefined;
}

// Global variable augmentation for Vercel Serverless & Node development
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const dbUrl = getDatabaseUrl();

const basePrisma =
  globalThis.prismaGlobal ||
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (!globalThis.prismaGlobal) {
  globalThis.prismaGlobal = basePrisma;
}

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        try {
          return await query(args);
        } catch (err: any) {
          const msg = (err && err.message) || '';
          const isClosed =
            msg.includes('Closed') ||
            msg.includes('closed') ||
            msg.includes('Connection') ||
            msg.includes('broken pipe') ||
            msg.includes('ECONNRESET') ||
            err?.code === 'P1001' ||
            err?.code === 'P1017';

          if (isClosed) {
            console.warn(`[PRISMA_RECONNECT] Reconnecting on ${model}.${operation} after connection drop...`);
            await basePrisma.$disconnect().catch(() => {});
            await basePrisma.$connect().catch(() => {});
            return await query(args);
          }
          throw err;
        }
      },
    },
  },
});

export default prisma;

