# Marcella Framework

Reusable infrastructure for Cloudflare Workers + React applications.

## Packages

| Package | Description |
|---------|-------------|
| [@marcellafoundation/d1](./packages/d1) | Auto-detecting Cloudflare D1 client (Workers + Node.js) |
| [@marcellafoundation/storage](./packages/storage) | React localStorage hooks with SSR safety |
| [@marcellafoundation/slack](./packages/slack) | Slack Block Kit client |
| [@marcellafoundation/dates](./packages/dates) | Date utilities with timezone support |

## Quick Start

### Create a new project

```bash
npx degit marcella-foundation/marcella-framework/template my-project
cd my-project
npm install
npm run dev
```

### Use packages in existing project

```bash
npm install @marcellafoundation/d1 @marcellafoundation/storage @marcellafoundation/slack @marcellafoundation/dates
```

## Package Usage

### @marcellafoundation/d1

Auto-detecting D1 client that works in both Workers and Node.js:

```typescript
import { createD1Client } from '@marcellafoundation/d1';

// In Cloudflare Workers
const db = createD1Client({ binding: env.DB });

// In Node.js (REST API)
const db = createD1Client({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN
});

// Same API in both environments
const users = await db.queryAll<User>('SELECT * FROM users');
const user = await db.queryOne<User>('SELECT * FROM users WHERE id = ?', [1]);
```

### @marcellafoundation/storage

React hook for persistent localStorage state:

```tsx
import { useLocalStorage } from '@marcellafoundation/storage';

function App() {
  const [theme, setTheme] = useLocalStorage('app.theme', 'light');

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </button>
  );
}
```

### @marcellafoundation/slack

Post Block Kit messages to Slack:

```typescript
import { createSlackClient, section, divider } from '@marcellafoundation/slack';

const slack = createSlackClient({
  token: process.env.SLACK_BOT_TOKEN,
  defaultChannel: process.env.SLACK_CHANNEL
});

await slack.post([
  section('*New event!* Something happened'),
  divider(),
  section('Details here...')
], { text: 'New event notification' });
```

### @marcellafoundation/dates

Date utilities with configurable timezone:

```typescript
import { createDateUtils, formatDateISO, parseTimeString } from '@marcellafoundation/dates';

// Create timezone-specific utilities
const pacific = createDateUtils('America/Los_Angeles');
const eastern = createDateUtils('America/New_York');

// Get offset (handles DST automatically)
pacific.getOffset(new Date()); // '-08:00' or '-07:00'

// Format for display
pacific.formatTime(new Date()); // 'Jan 3, 10:30 AM'

// Timezone-agnostic utilities
formatDateISO(new Date()); // '2024-01-03'
parseTimeString('8:30 am'); // { hours: 8, minutes: 30 }
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Type check
npm run typecheck
```

## Publishing

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version management:

```bash
# Create a changeset
npx changeset

# Version packages
npm run version

# Publish (usually handled by CI)
npm run publish
```

## License

MIT
