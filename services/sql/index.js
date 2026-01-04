/**
 * Auto-detecting SQL client factory
 * Works in both Node.js (REST API) and Cloudflare Workers (native D1 binding)
 */
export function createSqlClient(config) {
  // Detect environment
  if (isWorkersEnvironment(config)) {
    return createWorkerBinding(config);
  }
  return createRESTClient(config);
}

function isWorkersEnvironment(config) {
  // Workers binding has .prepare() method
  return config.binding && typeof config.binding.prepare === 'function';
}

function createWorkerBinding({ binding }) {
  return {
    async query(sql, params = []) {
      const stmt = binding.prepare(sql);
      if (params.length > 0) {
        return await stmt.bind(...params).all();
      }
      return await stmt.all();
    },
    async queryOne(sql, params = []) {
      const result = await this.query(sql, params);
      return result.results?.[0] || null;
    },
    async queryAll(sql, params = []) {
      const result = await this.query(sql, params);
      return result.results || [];
    },
    async execute(sql, params = []) {
      const stmt = binding.prepare(sql);
      if (params.length > 0) {
        return await stmt.bind(...params).run();
      }
      return await stmt.run();
    }
  };
}

function createRESTClient({ accountId, databaseId, apiToken }) {
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  return {
    async query(sql, params = []) {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql, params })
      });

      const result = await response.json();

      if (!result.success) {
        console.error('D1 Error:', JSON.stringify(result.errors, null, 2));
        throw new Error(`D1 query failed: ${result.errors?.[0]?.message || 'Unknown error'}`);
      }

      return result.result;
    },

    async queryOne(sql, params = []) {
      const result = await this.query(sql, params);
      return result[0]?.results?.[0] || null;
    },

    async queryAll(sql, params = []) {
      const result = await this.query(sql, params);
      return result[0]?.results || [];
    },

    async execute(sql, params = []) {
      const result = await this.query(sql, params);
      return result[0]?.meta || result[0] || {};
    }
  };
}
