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
```

## Framework Packages

This project uses the Marcella Framework packages:

- `@marcellafoundation/d1` - Cloudflare D1 database client
- `@marcellafoundation/storage` - React localStorage hooks
- `@marcellafoundation/slack` - Slack notifications (optional)
- `@marcellafoundation/dates` - Date utilities

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

## Development Guidelines

- Keep the API lightweight - use Workers for edge performance
- Use `@marcellafoundation/storage` for persistent UI state
- Follow existing patterns in the codebase
