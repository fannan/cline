# Marcella Framework

Project template and service libraries for Cloudflare Workers + React applications.

## Quick Start

```bash
# Create a new project
./create-project.sh my-app

# Or clone manually
cp -r template my-app
cd my-app
npm install
npm run dev
```

## Structure

```
marcella-framework/
├── template/           # Full starter project
│   ├── packages/
│   │   ├── api/        # Hono on Cloudflare Workers
│   │   ├── dashboard/  # React + Vite + Tailwind
│   │   └── shared/     # Local shared code
│   └── ...
│
└── services/           # Drop-in service libraries
    ├── d1/             # Cloudflare D1 database client
    ├── r2/             # Cloudflare R2 object storage
    ├── slack/          # Slack Block Kit messaging
    └── storage/        # React localStorage hooks
```

## Adding Services

Services are standalone libraries you copy into your project:

```bash
# Need Slack notifications?
cp -r services/slack my-app/packages/shared/slack

# Need R2 storage?
cp -r services/r2 my-app/packages/shared/r2
```

Each service has its own README with usage examples.

## Services

| Service | Purpose |
|---------|---------|
| [d1](./services/d1/) | Cloudflare D1 database client (Workers + Node.js) |
| [r2](./services/r2/) | Cloudflare R2 object storage (Workers + Node.js) |
| [slack](./services/slack/) | Slack Block Kit messaging |
| [storage](./services/storage/) | React localStorage hooks with cross-tab sync |

## Versioning

Projects track which template version they were created from:

```bash
# Check your project's template version
cat .template-version

# See what's new
gh release list --repo fannan/marcella-framework
```

## Updating Services

To update a service in your project:

```bash
# Check what changed
diff -r my-app/packages/shared/d1 marcella-framework/services/d1

# Copy updated version
cp -r marcella-framework/services/d1/* my-app/packages/shared/d1/
```

## Development

This template is synced from patterns in the [FeedTahoe](https://github.com/fannan/FoodRescueTracker) project.

To sync updates from FeedTahoe:
```bash
# In FeedTahoe repo
./scripts/sync-to-template.sh
```
