# My App - Project Guide

## Overview

Monorepo with API (Cloudflare Workers) and Dashboard (React + Vite).

## Quick Commands

```bash
# Local development (runs API + Dashboard in parallel)
npm run dev

# Or run individually:
npm run dev -w @my-app/api        # API on http://localhost:8787
npm run dev -w @my-app/dashboard  # Dashboard on http://localhost:5173
```

**Deployment:** Automatic via GitHub Actions on push to `main`.

## Architecture

```
packages/
├── api/           # @my-app/api - Hono on Cloudflare Workers
├── dashboard/     # @my-app/dashboard - React + Vite + Tailwind
└── shared/        # Project-specific shared code

jobs/
└── <category>/    # Organized by domain (e.g., feed, sync, notifications)
    └── <job>/     # Individual scheduled job
```

## Key Files

| File | Purpose |
|------|---------|
| `packages/api/src/index.js` | API routes |
| `packages/api/wrangler.toml` | Workers config |
| `packages/dashboard/src/App.jsx` | Main React component |
| `packages/dashboard/vite.config.js` | Vite configuration |

## Environment Variables

Configure in Cloudflare dashboard or GitHub secrets:

```bash
# Cloudflare (required)
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# D1 Database (configure in wrangler.toml)
# CLOUDFLARE_D1_DATABASE_ID=
```

## Using Framework Services

Services are available via the `@cline/core` git dependency:

```javascript
// D1 database client
import { createD1Client } from '@cline/core/d1';

// Slack notifications
import { createSlackClient, blocks } from '@cline/core/slack';

// React localStorage hooks
import { useLocalStorage } from '@cline/core/storage';

// R2 object storage
import { createR2Client } from '@cline/core/r2';
```

## Adding Jobs

Create scheduled jobs in `jobs/<category>/<job-name>/`:

```bash
mkdir -p jobs/sync/my-scraper
```

Create `package.json`:
```json
{
  "name": "@my-app/my-scraper",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "sync": "node index.js"
  }
}
```

Run with: `npm run sync -w @my-app/my-scraper`

## Development Guidelines

- Keep the API lightweight - use Workers for edge performance
- Use shared services for consistent patterns across Node.js and Workers
- Follow existing patterns in the codebase
