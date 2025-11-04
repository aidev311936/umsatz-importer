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

    if (shouldDefaultToSsl(url)) {
      return { rejectUnauthorized: false };
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

function shouldDefaultToSsl(url: URL): boolean {
  const hostname = url.hostname;
  if (!hostname) {
    return false;
  }

  return !isLocalHost(hostname);
}

function isLocalHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  if (normalized === 'localhost' || normalized === '::1' || normalized.endsWith('.local')) {
    return true;
  }

  if (normalized === '127.0.0.1') {
    return true;
  }

  if (!/^[0-9.]+$/.test(normalized)) {
    return false;
  }

  const octets = normalized.split('.').map((part) => Number.parseInt(part, 10));
  if (octets.length !== 4 || octets.some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
    return false;
  }

  if (octets[0] === 10) {
    return true;
  }

  if (octets[0] === 127) {
    return true;
  }

  if (octets[0] === 192 && octets[1] === 168) {
    return true;
  }

  if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
    return true;
  }

  return false;
}

export async function shutdownPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
