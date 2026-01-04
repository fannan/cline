# Slack Block Kit Client

Simple Slack client for sending Block Kit messages.

## Installation

Copy this directory to your project:

```bash
cp -r services/slack your-project/packages/shared/slack
```

## Usage

```javascript
import { createSlackClient } from '../shared/slack/index.js';

const slack = createSlackClient({
  token: process.env.SLACK_BOT_TOKEN,
  defaultChannel: process.env.SLACK_CHANNEL
});

// Send a Block Kit message
await slack.post([
  {
    type: 'section',
    text: { type: 'mrkdwn', text: '*New order received!*' }
  },
  {
    type: 'section',
    fields: [
      { type: 'mrkdwn', text: '*Customer:*\nJohn Doe' },
      { type: 'mrkdwn', text: '*Total:*\n$42.00' }
    ]
  }
], { text: 'New order received' });
```

## API

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
