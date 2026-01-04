/**
 * Auto-detecting R2 client factory
 * Works in both Node.js (REST API) and Cloudflare Workers (native binding)
 */
export function createR2Client(config) {
  // Detect environment
  if (isWorkersEnvironment(config)) {
    return createWorkerBinding(config);
  }
  return createRESTClient(config);
}

function isWorkersEnvironment(config) {
  // Workers binding has .put() method directly
  return config.binding && typeof config.binding.put === 'function';
}

function createWorkerBinding({ binding, publicUrl }) {
  return {
    /**
     * Upload a file to R2
     * @param {string} key - Object key (path)
     * @param {ArrayBuffer|Blob|string} data - File data
     * @param {Object} options - Upload options
     * @param {string} options.contentType - MIME type
     * @returns {Promise<string>} Public URL of uploaded object
     */
    async put(key, data, options = {}) {
      await binding.put(key, data, {
        httpMetadata: {
          contentType: options.contentType || 'application/octet-stream'
        }
      });
      return publicUrl ? `${publicUrl}/${key}` : key;
    },

    /**
     * Get an object from R2
     * @param {string} key - Object key
     * @returns {Promise<R2ObjectBody|null>}
     */
    async get(key) {
      return await binding.get(key);
    },

    /**
     * Delete an object from R2
     * @param {string} key - Object key
     */
    async delete(key) {
      await binding.delete(key);
    },

    /**
     * List objects in R2 with optional prefix
     * @param {Object} options
     * @param {string} options.prefix - Filter by prefix
     * @param {number} options.limit - Max results
     * @returns {Promise<Array>}
     */
    async list(options = {}) {
      const result = await binding.list({
        prefix: options.prefix,
        limit: options.limit || 1000
      });
      return result.objects || [];
    },

    /**
     * Check if an object exists
     * @param {string} key - Object key
     * @returns {Promise<boolean>}
     */
    async exists(key) {
      const obj = await binding.head(key);
      return obj !== null;
    },

    /**
     * Get public URL for an object
     * @param {string} key - Object key
     * @returns {string}
     */
    getPublicUrl(key) {
      return publicUrl ? `${publicUrl}/${key}` : key;
    }
  };
}

function createRESTClient({ accountId, bucketName, apiToken, publicUrl }) {
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects`;

  return {
    /**
     * Upload a file to R2 via REST API
     * @param {string} key - Object key (path)
     * @param {Buffer|ArrayBuffer|Blob} data - File data
     * @param {Object} options - Upload options
     * @param {string} options.contentType - MIME type
     * @returns {Promise<string>} Public URL of uploaded object
     */
    async put(key, data, options = {}) {
      const response = await fetch(`${baseUrl}/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': options.contentType || 'application/octet-stream'
        },
        body: data
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`R2 upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return publicUrl ? `${publicUrl}/${key}` : key;
    },

    /**
     * Get an object from R2 via REST API
     * @param {string} key - Object key
     * @returns {Promise<Response|null>}
     */
    async get(key) {
      const response = await fetch(`${baseUrl}/${encodeURIComponent(key)}`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`R2 get failed: ${response.status} ${response.statusText}`);
      }

      return response;
    },

    /**
     * Delete an object from R2 via REST API
     * @param {string} key - Object key
     */
    async delete(key) {
      const response = await fetch(`${baseUrl}/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`R2 delete failed: ${response.status} ${response.statusText}`);
      }
    },

    /**
     * List objects in R2 with optional prefix
     * Note: REST API listing is more limited than Workers binding
     * @param {Object} options
     * @param {string} options.prefix - Filter by prefix
     * @param {number} options.limit - Max results
     * @returns {Promise<Array>}
     */
    async list(options = {}) {
      const params = new URLSearchParams();
      if (options.prefix) params.set('prefix', options.prefix);
      if (options.limit) params.set('limit', String(options.limit));

      const listUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects?${params}`;
      const response = await fetch(listUrl, {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`R2 list failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.result || [];
    },

    /**
     * Check if an object exists
     * @param {string} key - Object key
     * @returns {Promise<boolean>}
     */
    async exists(key) {
      const response = await fetch(`${baseUrl}/${encodeURIComponent(key)}`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      });
      return response.ok;
    },

    /**
     * Get public URL for an object
     * @param {string} key - Object key
     * @returns {string}
     */
    getPublicUrl(key) {
      return publicUrl ? `${publicUrl}/${key}` : key;
    }
  };
}
