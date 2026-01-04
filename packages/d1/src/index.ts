/**
 * @marcella/d1
 * Auto-detecting Cloudflare D1 client that works in both
 * Node.js (REST API) and Cloudflare Workers (native binding)
 */

// Types for Cloudflare D1 binding (Workers environment)
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1RunResult>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}

export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta?: D1Meta;
}

export interface D1RunResult {
  success: boolean;
  meta: D1Meta;
}

export interface D1Meta {
  duration?: number;
  changes?: number;
  last_row_id?: number;
  rows_read?: number;
  rows_written?: number;
}

// REST API response types
interface D1RESTResponse {
  success: boolean;
  errors?: Array<{ message: string }>;
  result?: Array<{
    results?: Record<string, unknown>[];
    meta?: D1Meta;
  }>;
}

// Configuration types
export interface D1WorkerConfig {
  binding: D1Database;
}

export interface D1RESTConfig {
  accountId: string;
  databaseId: string;
  apiToken: string;
}

export type D1Config = D1WorkerConfig | D1RESTConfig;

// Client interface
export interface D1Client {
  /**
   * Execute a query and return full result object
   */
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<D1Result<T>>;

  /**
   * Execute a query and return the first row or null
   */
  queryOne<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<T | null>;

  /**
   * Execute a query and return all rows as an array
   */
  queryAll<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<T[]>;

  /**
   * Execute a write operation (INSERT, UPDATE, DELETE)
   */
  execute(sql: string, params?: unknown[]): Promise<D1Meta>;
}

/**
 * Type guard to check if config is for Workers environment
 */
function isWorkersConfig(config: D1Config): config is D1WorkerConfig {
  return (
    'binding' in config &&
    typeof (config as D1WorkerConfig).binding?.prepare === 'function'
  );
}

/**
 * Create a D1 client using Workers native binding
 */
function createWorkerBinding(config: D1WorkerConfig): D1Client {
  const { binding } = config;

  return {
    async query<T = Record<string, unknown>>(
      sql: string,
      params: unknown[] = []
    ): Promise<D1Result<T>> {
      const stmt = binding.prepare(sql);
      if (params.length > 0) {
        return (await stmt.bind(...params).all()) as D1Result<T>;
      }
      return (await stmt.all()) as D1Result<T>;
    },

    async queryOne<T = Record<string, unknown>>(
      sql: string,
      params: unknown[] = []
    ): Promise<T | null> {
      const result = await this.query<T>(sql, params);
      return result.results?.[0] ?? null;
    },

    async queryAll<T = Record<string, unknown>>(
      sql: string,
      params: unknown[] = []
    ): Promise<T[]> {
      const result = await this.query<T>(sql, params);
      return result.results ?? [];
    },

    async execute(sql: string, params: unknown[] = []): Promise<D1Meta> {
      const stmt = binding.prepare(sql);
      if (params.length > 0) {
        const result = await stmt.bind(...params).run();
        return result.meta;
      }
      const result = await stmt.run();
      return result.meta;
    },
  };
}

/**
 * Create a D1 client using REST API (for Node.js environments)
 */
function createRESTClient(config: D1RESTConfig): D1Client {
  const { accountId, databaseId, apiToken } = config;
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  async function executeQuery(
    sql: string,
    params: unknown[] = []
  ): Promise<D1RESTResponse> {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    });

    const result = (await response.json()) as D1RESTResponse;

    if (!result.success) {
      const errorMessage =
        result.errors?.[0]?.message ?? 'Unknown D1 error';
      console.error('D1 Error:', JSON.stringify(result.errors, null, 2));
      throw new Error(`D1 query failed: ${errorMessage}`);
    }

    return result;
  }

  return {
    async query<T = Record<string, unknown>>(
      sql: string,
      params: unknown[] = []
    ): Promise<D1Result<T>> {
      const result = await executeQuery(sql, params);
      const firstResult = result.result?.[0];
      return {
        results: (firstResult?.results as T[]) ?? [],
        success: true,
        meta: firstResult?.meta,
      };
    },

    async queryOne<T = Record<string, unknown>>(
      sql: string,
      params: unknown[] = []
    ): Promise<T | null> {
      const result = await this.query<T>(sql, params);
      return result.results?.[0] ?? null;
    },

    async queryAll<T = Record<string, unknown>>(
      sql: string,
      params: unknown[] = []
    ): Promise<T[]> {
      const result = await this.query<T>(sql, params);
      return result.results ?? [];
    },

    async execute(sql: string, params: unknown[] = []): Promise<D1Meta> {
      const result = await executeQuery(sql, params);
      return result.result?.[0]?.meta ?? {};
    },
  };
}

/**
 * Create a D1 client that auto-detects the environment
 *
 * @example Workers environment (native binding)
 * ```ts
 * const db = createD1Client({ binding: env.DB });
 * const users = await db.queryAll<User>('SELECT * FROM users');
 * ```
 *
 * @example Node.js environment (REST API)
 * ```ts
 * const db = createD1Client({
 *   accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
 *   databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID,
 *   apiToken: process.env.CLOUDFLARE_API_TOKEN
 * });
 * const user = await db.queryOne<User>('SELECT * FROM users WHERE id = ?', [1]);
 * ```
 */
export function createD1Client(config: D1Config): D1Client {
  if (isWorkersConfig(config)) {
    return createWorkerBinding(config);
  }
  return createRESTClient(config as D1RESTConfig);
}
