import pg from 'pg';
import { getEnv } from '../utils/parseEnv.js';

const { DATABASE_URL } = getEnv();

export const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: 10,
  ssl: DATABASE_URL.includes('sslmode') ? undefined : { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Unexpected database error', err);
});
