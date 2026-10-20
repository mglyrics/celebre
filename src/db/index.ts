/**
 * CELEBRE CATERING - Unified PostgreSQL Data Layer via Prisma ORM
 * 
 * Re-exports the centralized, serverless-optimized Prisma Client from src/lib/prisma.ts.
 * Operational dependencies on Drizzle ORM and direct pg Pool have been decommissioned
 * across all production and development query paths.
 */
import { prisma } from '../lib/prisma.ts';

export { prisma };
export const db = prisma;
export default prisma;
