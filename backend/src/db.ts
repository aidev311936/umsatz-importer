import { Pool } from 'pg';
import { DatabaseConfig } from './types.js';

let pool: Pool | null = null;

export function getPool(config: DatabaseConfig = {}): Pool {
  if (!pool) {
    const connectionString = config.connectionString ?? process.env.DATABASE_URL;
    pool = new Pool({
      connectionString,
      ssl: config.ssl ?? shouldUseSSL(),
    });
  }
  return pool;
}

function shouldUseSSL(): boolean | undefined {
  const flag = process.env.PGSSLMODE ?? '';
  if (!flag) {
    return undefined;
  }
  return flag !== 'disable';
}

export async function shutdownPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
