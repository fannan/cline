# @cline/core

Shared services for Cloudflare Workers + React applications.

## Installation

```bash
npm install github:fannan/cline#latest
```

Or pin to a version:
```bash
npm install github:fannan/cline#v1.0.0
```

## Usage

```javascript
import { createD1Client } from '@cline/core/d1';
import { createR2Client } from '@cline/core/r2';
import { createSlackClient, blocks } from '@cline/core/slack';
import { useLocalStorage } from '@cline/core/storage';
```

## Services

### D1 - Cloudflare D1 Database Client

Auto-detecting client that works in Workers (native binding) and Node.js (REST API).

```javascript
import { createD1Client } from '@cline/core/d1';

// In Workers
const db = createD1Client({ binding: env.DB });

// In Node.js
const db = createD1Client({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN
});

const users = await db.queryAll('SELECT * FROM users');
```

### R2 - Cloudflare R2 Object Storage

Auto-detecting client for R2 bucket operations.

```javascript
import { createR2Client } from '@cline/core/r2';

// In Workers
const storage = createR2Client({ binding: env.BUCKET, publicUrl: env.R2_PUBLIC_URL });

// In Node.js
const storage = createR2Client({
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
import { createSlackClient, blocks } from '@cline/core/slack';

const slack = createSlackClient({
  token: process.env.SLACK_BOT_TOKEN,
  defaultChannel: process.env.SLACK_CHANNEL
});

await slack.post([
  blocks.header('🆕 New Order'),
  blocks.fields(['Customer', 'John'], ['Total', '$42']),
  blocks.section('Order details...'),
  blocks.button('View', 'https://example.com', 'view_btn'),
  blocks.divider()
], { text: 'New order' });
```

### Storage - React localStorage Hook

Persistent state with cross-tab sync.

```javascript
import { useLocalStorage } from '@cline/core/storage';

function Settings() {
  const [theme, setTheme] = useLocalStorage('app.theme', 'light');
  return <button onClick={() => setTheme('dark')}>Dark Mode</button>;
}
```

## Versioning

- `#latest` - Current development (may have breaking changes)
- `#v1` - Stable v1.x branch (gets patches)
- `#v1.0.0` - Frozen snapshot

## Project Template

To scaffold a new project using these services:

```bash
./create-project.sh my-app
```
