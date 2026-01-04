# D1 Database Client

Auto-detecting Cloudflare D1 client that works in both:
- **Cloudflare Workers** - Uses native binding (fast, no auth needed)
- **Node.js** - Uses REST API (for scripts, cron jobs, local dev)

## Installation

Copy this directory to your project:

```bash
cp -r services/d1 your-project/packages/shared/d1
```

## Usage

### In Cloudflare Workers

```javascript
import { createD1Client } from '../shared/d1/index.js';

export default {
  async fetch(request, env) {
    const db = createD1Client({ binding: env.DB });

    const users = await db.queryAll('SELECT * FROM users');
    return Response.json(users);
  }
};
```

### In Node.js Scripts

```javascript
import { createD1Client } from '../shared/d1/index.js';

const db = createD1Client({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN
});

const users = await db.queryAll('SELECT * FROM users');
```

## API

| Method | Description |
|--------|-------------|
| `query(sql, params)` | Run query, return raw result |
| `queryOne(sql, params)` | Return first row or null |
| `queryAll(sql, params)` | Return array of rows |
| `execute(sql, params)` | Run INSERT/UPDATE/DELETE |

## Environment Variables

For Node.js usage:

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_D1_DATABASE_ID=your-database-id
CLOUDFLARE_API_TOKEN=your-api-token
```
