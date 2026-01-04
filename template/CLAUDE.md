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
    ├── d1/        # D1 database client (if added)
    ├── r2/        # R2 storage client (if added)
    └── ...
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

## Adding Services

Copy services from the marcella-framework repo:

```bash
# D1 database client
cp -r path/to/marcella-framework/services/d1 packages/shared/d1

# R2 object storage
cp -r path/to/marcella-framework/services/r2 packages/shared/r2

# Slack notifications
cp -r path/to/marcella-framework/services/slack packages/shared/slack

# React localStorage hooks
cp -r path/to/marcella-framework/services/storage packages/shared/storage
```

## Development Guidelines

- Keep the API lightweight - use Workers for edge performance
- Use shared services for consistent patterns across Node.js and Workers
- Follow existing patterns in the codebase
