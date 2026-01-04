# R2 Object Storage Client

Auto-detecting Cloudflare R2 client that works in both:
- **Cloudflare Workers** - Uses native binding (fast, no auth needed)
- **Node.js** - Uses REST API (for scripts, cron jobs, local dev)

## Installation

Copy this directory to your project:

```bash
cp -r services/r2 your-project/packages/shared/r2
```

## Usage

### In Cloudflare Workers

```javascript
import { createR2Client } from '../shared/r2/index.js';

export default {
  async fetch(request, env) {
    const storage = createR2Client({
      binding: env.MY_BUCKET,
      publicUrl: env.R2_PUBLIC_URL // optional
    });

    // Upload
    const url = await storage.put('images/photo.jpg', imageData, {
      contentType: 'image/jpeg'
    });

    // Get
    const obj = await storage.get('images/photo.jpg');
    const data = await obj.arrayBuffer();

    return new Response(data, {
      headers: { 'Content-Type': 'image/jpeg' }
    });
  }
};
```

### In Node.js Scripts

```javascript
import { createR2Client } from '../shared/r2/index.js';

const storage = createR2Client({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  bucketName: process.env.R2_BUCKET_NAME,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  publicUrl: process.env.R2_PUBLIC_URL // optional
});

// Upload a file
const url = await storage.put('images/photo.jpg', buffer, {
  contentType: 'image/jpeg'
});
console.log('Uploaded:', url);

// Check if exists
const exists = await storage.exists('images/photo.jpg');

// List objects
const objects = await storage.list({ prefix: 'images/', limit: 100 });
```

## API

| Method | Description |
|--------|-------------|
| `put(key, data, options)` | Upload file, returns public URL |
| `get(key)` | Get object (returns body or null) |
| `delete(key)` | Delete object |
| `list({ prefix, limit })` | List objects |
| `exists(key)` | Check if object exists |
| `getPublicUrl(key)` | Get public URL for object |

## Environment Variables

For Node.js usage:

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
R2_BUCKET_NAME=your-bucket-name
CLOUDFLARE_API_TOKEN=your-api-token
R2_PUBLIC_URL=https://pub-xxx.r2.dev  # optional, for public access
```

## wrangler.toml Setup

For Workers:

```toml
[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "your-bucket-name"
```
