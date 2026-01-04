# Jobs Directory

Scheduled jobs and background tasks organized by category.

## Structure

```
jobs/
├── <category>/           # e.g., feed, sync, notifications
│   └── <job-name>/       # e.g., feedtahoe-scraper
│       ├── package.json  # Job dependencies
│       ├── index.js      # Entry point
│       └── ...
```

## Workspace Pattern

Jobs are npm workspaces at `jobs/*/*`.

Example package.json for a job:
```json
{
  "name": "@my-app/my-job",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "run": "node index.js"
  }
}
```

Run with: `npm run run -w @my-app/my-job`

