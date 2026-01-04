# Slack Block Kit Client

Slack client with Block Kit helpers for building messages.

## Installation

Copy this directory to your project:

```bash
cp -r services/slack your-project/packages/shared/slack
```

## Usage

```javascript
import { createSlackClient, blocks } from '../shared/slack/index.js';

const slack = createSlackClient({
  token: process.env.SLACK_BOT_TOKEN,
  defaultChannel: process.env.SLACK_CHANNEL
});

// Using block helpers (recommended)
await slack.post([
  blocks.header('🆕 New Order'),
  blocks.fields(['Customer', 'John Doe'], ['Total', '$42.00']),
  blocks.section('*Items:* 3 pizzas, 2 sodas'),
  blocks.context('Order #12345 | Placed just now'),
  blocks.button('🔗 View Order', 'https://example.com/orders/12345', 'view_order'),
  blocks.divider()
], { text: 'New order received' });
```

## Block Helpers

The `blocks` object provides helpers for common Block Kit elements:

| Helper | Description | Example |
|--------|-------------|---------|
| `header(text)` | Header block with emoji support | `blocks.header('🎉 Title')` |
| `section(text)` | Markdown text section | `blocks.section('*Bold* and _italic_')` |
| `fields(...pairs)` | Two-column layout | `blocks.fields(['Label', 'Value'], ['Label2', 'Value2'])` |
| `context(text)` | Secondary/muted text | `blocks.context('Footer info')` |
| `button(label, url, actionId)` | Link button | `blocks.button('View', 'https://...', 'btn_1')` |
| `image(url, alt)` | Image block | `blocks.image('https://...', 'Description')` |
| `divider()` | Horizontal divider | `blocks.divider()` |

## Client API

### `createSlackClient({ token, defaultChannel })`

Creates a Slack client instance.

### `slack.post(blocks, options)`

Post a message with Block Kit blocks.

| Option | Description |
|--------|-------------|
| `text` | Fallback text for notifications |
| `channel` | Override default channel |
| `username` | Bot display name |
| `icon_emoji` | Bot emoji (e.g., `:robot:`) |

### `slack.clearChannel(channelId, limit)`

Delete the bot's own messages from a channel. Useful for cleanup scripts.

## Environment Variables

```bash
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_CHANNEL=C0123456789
```

## Getting a Slack Token

1. Create an app at https://api.slack.com/apps
2. Add OAuth scopes: `chat:write`, `channels:history` (for clearChannel)
3. Install to workspace and copy the Bot Token
