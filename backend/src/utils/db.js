import pg from 'pg';

const { Pool, types } = pg;

const TEXT_ARRAY_OID = 1009;
types.setTypeParser(TEXT_ARRAY_OID, (val) => {
  if (!val) return [];
  // Remove braces and split by comma, handling quoted strings
  const array = val
    .slice(1, -1)
    .match(/([^",]+|"(?:[^"\\]|\\.)*")+/g);
  return array ? array.map((item) => item.replace(/^"|"$/g, '').replace(/\\"/g, '"')) : [];
});

export function createPool() {
  const baseConnectionString = process.env.DATABASE_URL;
  const sslMode = process.env.PGSSLMODE;
  let connectionString = baseConnectionString;

  if (!connectionString) {
    console.warn('DATABASE_URL is not set. Database features will not work.');
  } else if (sslMode) {
    const hasQuery = connectionString.includes('?');
    const hasSslModeParam = /[?&]sslmode=/i.test(connectionString);
    if (!hasSslModeParam) {
      const separator = hasQuery ? '&' : '?';
      connectionString = `${connectionString}${separator}sslmode=${sslMode}`;
    }
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  pool.on('error', (error) => {
    console.error('Unexpected database error', error);
  });

  return pool;
}
