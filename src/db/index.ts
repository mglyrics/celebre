import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const config: any = {
      max: 10,
      connectionTimeoutMillis: 15000,
    };

    if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
      config.connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      const isLocal = config.connectionString.includes('localhost') || config.connectionString.includes('127.0.0.1');
      if (process.env.NODE_ENV === 'production' && !isLocal) {
        config.ssl = { rejectUnauthorized: false };
      }
    } else {
      config.host = process.env.SQL_HOST;
      config.port = Number(process.env.SQL_PORT || 5432);
      config.user = process.env.SQL_USER;
      config.password = process.env.SQL_PASSWORD;
      config.database = process.env.SQL_DB_NAME;
    }

    global._postgresPool = new Pool(config);

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
