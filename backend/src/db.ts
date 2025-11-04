import { Pool } from 'pg';
import { DatabaseConfig } from './types.js';

let pool: Pool | null = null;

export function getPool(config: DatabaseConfig = {}): Pool {
  if (!pool) {
    const connectionString = config.connectionString ?? process.env.DATABASE_URL;
    pool = new Pool({
      connectionString,
      ssl: resolveSslSetting(connectionString, config.ssl),
    });
  }
  return pool;
}

function resolveSslSetting(
  connectionString: string | undefined,
  override: DatabaseConfig['ssl']
): DatabaseConfig['ssl'] {
  if (override !== undefined) {
    return override;
  }

  const envMode = process.env.PGSSLMODE;
  const envSetting = parseSslMode(envMode);
  if (envSetting !== undefined) {
    return envSetting;
  }

  if (process.env.PGSSL) {
    const interpreted = parseSslMode(process.env.PGSSL);
    if (interpreted !== undefined) {
      return interpreted;
    }
  }

  return parseConnectionStringSsl(connectionString);
}

function parseConnectionStringSsl(connectionString: string | undefined): DatabaseConfig['ssl'] {
  if (!connectionString) {
    return undefined;
  }

  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get('sslmode') ?? url.searchParams.get('ssl');
    const interpreted = parseSslMode(sslMode ?? undefined);
    if (interpreted !== undefined) {
      return interpreted;
    }
  } catch (error) {
    // ignore invalid connection strings and fall back to pg defaults
  }

  return undefined;
}

function parseSslMode(value: string | undefined | null): DatabaseConfig['ssl'] {
  if (!value) {
    return undefined;
  }

  const normalized = value.toString().trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (['disable', 'off', 'false', '0', 'no'].includes(normalized)) {
    return false;
  }

  if (['require', 'prefer', 'allow', 'verify-ca'].includes(normalized)) {
    return { rejectUnauthorized: false };
  }

  if (['verify-full', 'true', '1', 'on'].includes(normalized)) {
    return true;
  }

  return undefined;
}

export async function shutdownPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
