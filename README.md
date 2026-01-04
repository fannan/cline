# @cline/core

Shared services for Cloudflare Workers + React applications.

## Installation

```bash
npm install github:fannan/cline#latest
```

Or pin to a version:
```bash
npm install github:fannan/cline#v2.0.0
```

## Usage

```javascript
// Services
import { createSqlClient } from '@cline/core/services/sql';
import { createS3Client } from '@cline/core/services/s3';
import { createSlackClient, blocks } from '@cline/core/services/slack';

// React hooks
import { useLocalStorage } from '@cline/core/react/storage';

// Job framework
import { Job, setupJobsTable } from '@cline/core/jobs';
```

## Services

### SQL - Cloudflare D1 Database Client

Auto-detecting client that works in Workers (native binding) and Node.js (REST API).

```javascript
import { createSqlClient } from '@cline/core/services/sql';

// In Workers
const db = createSqlClient({ binding: env.DB });

// In Node.js
const db = createSqlClient({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN
});

const users = await db.queryAll('SELECT * FROM users');
```

### S3 - Cloudflare R2 Object Storage

Auto-detecting client for S3-compatible bucket operations.

```javascript
import { createS3Client } from '@cline/core/services/s3';

// In Workers
const storage = createS3Client({ binding: env.BUCKET, publicUrl: env.R2_PUBLIC_URL });

// In Node.js
const storage = createS3Client({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  bucketName: process.env.R2_BUCKET_NAME,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  publicUrl: process.env.R2_PUBLIC_URL
});

const url = await storage.put('images/photo.jpg', buffer, { contentType: 'image/jpeg' });
```

### Slack - Block Kit Client

Slack messaging with Block Kit helpers.

```javascript
import { createSlackClient, blocks } from '@cline/core/services/slack';

const slack = createSlackClient({
  token: process.env.SLACK_BOT_TOKEN,
  defaultChannel: process.env.SLACK_CHANNEL
});

await slack.post([
  blocks.header('New Order'),
  blocks.fields(['Customer', 'John'], ['Total', '$42']),
  blocks.section('Order details...'),
  blocks.button('View', 'https://example.com', 'view_btn'),
  blocks.divider()
], { text: 'New order' });
```

## React Hooks

### Storage - localStorage Hook

Persistent state with cross-tab sync.

```javascript
import { useLocalStorage } from '@cline/core/react/storage';

function Settings() {
  const [theme, setTheme] = useLocalStorage('app.theme', 'light');
  return <button onClick={() => setTheme('dark')}>Dark Mode</button>;
}
```

## Job Framework

### Jobs - Instrumented Job Execution

Class-based job framework with automatic D1 logging and Slack notifications.

```javascript
import { Job, setupJobsTable } from '@cline/core/jobs';

class MySync extends Job {
  static config = { name: 'my-sync', slack: { channel: 'C...', heartbeat: true } };
  async run(context) { return { notable: true }; }
}

await new MySync({ db, slack }).execute();
```

See [jobs/README.md](./jobs/README.md) for full documentation.

## Versioning

- `#latest` - Current development (may have breaking changes)
- `#v2` - Stable v2.x branch (gets patches)
- `#v2.0.0` - Frozen snapshot

## Project Template

To scaffold a new project using these services:

```bash
./create-project.sh my-app
```
