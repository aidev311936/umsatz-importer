declare module 'pg' {
  interface QueryConfig {
    text: string;
    values?: unknown[];
  }

  export interface QueryResult<R = any> {
    command: string;
    rowCount: number;
    oid: number;
    rows: R[];
    fields: Array<{ name: string }>;
  }

  export interface PoolClient {
    query<R = any>(queryText: string | QueryConfig, values?: unknown[]): Promise<QueryResult<R>>;
    release(err?: Error): void;
  }

  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized: boolean };
    max?: number;
    idleTimeoutMillis?: number;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query<R = any>(queryText: string | QueryConfig, values?: unknown[]): Promise<QueryResult<R>>;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
  }
}
