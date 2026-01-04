# Job Framework

Class-based job execution with automatic D1 logging and Slack notifications.

## Features

- **D1 Logging** - Automatic `job_runs` table tracking (optional)
- **Slack Notifications** - Error alerts and heartbeat for quiet runs (optional)
- **Flexible** - Use both, either, or neither

## Usage

### Define a Job

```javascript
import { Job, setupJobsTable } from '@cline/core/jobs';

class MySync extends Job {
  static config = {
    name: 'my-sync',
    // Optional: enable Slack notifications
    slack: {
      channel: 'C0A5PCREQPP',
      username: 'My Bot',
      icon_emoji: ':robot_face:',
      heartbeat: true  // Track quiet runs with visual dots
    }
  };

  async run(context) {
    // context.db - D1 client (if provided)
    // context.runId - this run's ID (if D1 enabled)
    // context.log(msg) - structured logging

    const results = await this.doWork();

    // Return output data (stored as JSON in job_runs)
    return {
      processed: results.count,
      notable: results.changes > 0  // Tells heartbeat when to reset
    };
  }
}
```

### Execute

```javascript
// One-time setup (creates tables if needed)
await setupJobsTable(db);

// Full instrumentation: D1 + Slack
const job = new MySync({ db, slack });
await job.execute();

// D1 logging only
const job = new MySync({ db });

// Slack only
const job = new MySync({ slack });

// Bare execution (stdout only)
const job = new MySync();
```

## Lifecycle

1. `execute()` creates `job_runs` record (status: 'running')
2. Calls your `run()` method
3. On success: updates record (status: 'completed', output_data: JSON)
4. On error: updates record (status: 'failed', error_message)
5. Handles Slack notifications based on config

## Heartbeat Feature

When `slack.heartbeat: true`, quiet runs (where `notable: false`) update a single Slack message with growing dots:

```
✓ my-sync • No updates
••••••••••
12 runs since last update (2h 15m)
```

When a notable update occurs (`notable: true`), the heartbeat resets.

## Tables

Created by `setupJobsTable(db)`:

### job_runs

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| job_name | TEXT | Job identifier from config |
| started_at | TEXT | ISO timestamp |
| completed_at | TEXT | ISO timestamp |
| status | TEXT | 'running', 'completed', 'failed' |
| output_data | TEXT | JSON blob from run() return |
| error_message | TEXT | Error message if failed |

### sync_state

Key-value store for heartbeat state tracking.

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT | Primary key (e.g., 'job:my-sync:heartbeat') |
| value | TEXT | JSON state |
| updated_at | TEXT | ISO timestamp |

## Environment Variables

For Slack notifications:

```bash
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL=C0A5PCREQPP
```

For D1 logging (in Node.js):

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_D1_DATABASE_ID=your-database-id
CLOUDFLARE_API_TOKEN=your-api-token
```
