import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/big_picture_auction?schema=public';

let pool: Pool | undefined;
let adapter: PrismaPg | undefined;

function getAdapter() {
  if (!adapter) {
    // Configure pool for Neon
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 60000,
      query_timeout: 60000,
      ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
    });

    // Prevent unhandled pool errors
    pool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
    });

    adapter = new PrismaPg(pool);
  }
  return adapter;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient; prismaPool: Pool | undefined };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: getAdapter(),
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPool = pool;
}
