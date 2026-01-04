/**
 * @marcella/slack
 * Slack Block Kit client for posting messages
 * with graceful degradation when not configured
 */

/**
 * Slack Block Kit block types
 * @see https://api.slack.com/reference/block-kit/blocks
 */
export type SlackBlock =
  | SectionBlock
  | DividerBlock
  | HeaderBlock
  | ContextBlock
  | ActionsBlock
  | ImageBlock
  | Record<string, unknown>;

export interface SectionBlock {
  type: 'section';
  text?: TextObject;
  fields?: TextObject[];
  accessory?: unknown;
}

export interface DividerBlock {
  type: 'divider';
}

export interface HeaderBlock {
  type: 'header';
  text: TextObject;
}

export interface ContextBlock {
  type: 'context';
  elements: Array<TextObject | ImageElement>;
}

export interface ActionsBlock {
  type: 'actions';
  elements: unknown[];
}

export interface ImageBlock {
  type: 'image';
  image_url: string;
  alt_text: string;
  title?: TextObject;
}

export interface TextObject {
  type: 'plain_text' | 'mrkdwn';
  text: string;
  emoji?: boolean;
}

export interface ImageElement {
  type: 'image';
  image_url: string;
  alt_text: string;
}

/**
 * Options for posting a message
 */
export interface PostMessageOptions {
  /**
   * Fallback text for notifications
   */
  text?: string;

  /**
   * Override default channel
   */
  channel?: string;

  /**
   * Bot display name
   */
  username?: string;

  /**
   * Bot icon emoji (e.g., ':robot:')
   */
  icon_emoji?: string;

  /**
   * Thread timestamp to reply to
   */
  thread_ts?: string;
}

/**
 * Slack API response
 */
export interface SlackResponse {
  ok: boolean;
  error?: string;
  ts?: string;
  channel?: string;
  message?: Record<string, unknown>;
}

/**
 * Result from clearing a channel
 */
export interface ClearChannelResult {
  deleted: number;
  failed: number;
}

/**
 * Slack client interface
 */
export interface SlackClient {
  /**
   * Post a message using Block Kit
   */
  post(
    blocks: SlackBlock[],
    options?: PostMessageOptions
  ): Promise<SlackResponse | null>;

  /**
   * Delete messages from a channel (bot's own messages only)
   */
  clearChannel(channelId: string, limit?: number): Promise<ClearChannelResult>;
}

/**
 * Configuration for creating a Slack client
 */
export interface SlackClientConfig {
  /**
   * Slack Bot Token (xoxb-...)
   */
  token?: string;

  /**
   * Default channel ID or name
   */
  defaultChannel?: string;
}

/**
 * System message subtypes that should not be deleted
 */
const SYSTEM_SUBTYPES = [
  'channel_join',
  'channel_leave',
  'channel_purpose',
  'channel_topic',
];

/**
 * Create a Slack client for posting Block Kit messages
 *
 * @example
 * ```ts
 * const slack = createSlackClient({
 *   token: process.env.SLACK_BOT_TOKEN,
 *   defaultChannel: process.env.SLACK_CHANNEL
 * });
 *
 * await slack.post([
 *   {
 *     type: 'section',
 *     text: { type: 'mrkdwn', text: '*Hello* from your app!' }
 *   }
 * ], { text: 'Hello notification' });
 * ```
 */
export function createSlackClient(config: SlackClientConfig): SlackClient {
  const { token, defaultChannel } = config;

  return {
    async post(
      blocks: SlackBlock[],
      options: PostMessageOptions = {}
    ): Promise<SlackResponse | null> {
      const {
        text = 'Update',
        channel = defaultChannel,
        username,
        icon_emoji,
        thread_ts,
      } = options;

      if (!token || !channel) {
        console.log('Slack not configured, skipping notification');
        return null;
      }

      const body: Record<string, unknown> = {
        channel,
        text,
        blocks,
      };

      if (username) body.username = username;
      if (icon_emoji) body.icon_emoji = icon_emoji;
      if (thread_ts) body.thread_ts = thread_ts;

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = (await response.json()) as SlackResponse;

      if (!result.ok) {
        console.error('Slack error:', result.error);
      }

      return result;
    },

    async clearChannel(
      channelId: string,
      limit = 200
    ): Promise<ClearChannelResult> {
      let deleted = 0;
      let failed = 0;
      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          channel: channelId,
          limit: String(limit),
        });
        if (cursor) params.append('cursor', cursor);

        const historyRes = await fetch(
          `https://slack.com/api/conversations.history?${params}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const history = (await historyRes.json()) as {
          ok: boolean;
          messages?: Array<{
            ts: string;
            subtype?: string;
          }>;
          response_metadata?: { next_cursor?: string };
        };

        if (!history.ok || !history.messages?.length) break;

        for (const msg of history.messages) {
          // Skip system messages
          if (msg.subtype && SYSTEM_SUBTYPES.includes(msg.subtype)) {
            continue;
          }

          const delRes = await fetch('https://slack.com/api/chat.delete', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ channel: channelId, ts: msg.ts }),
          });

          const delResult = (await delRes.json()) as { ok: boolean };

          if (delResult.ok) {
            deleted++;
          } else {
            failed++;
          }

          // Rate limit protection (100ms between deletes)
          await new Promise((r) => setTimeout(r, 100));
        }

        cursor = history.response_metadata?.next_cursor;
        hasMore = !!cursor;
      }

      return { deleted, failed };
    },
  };
}

// Block Kit helpers

/**
 * Create a section block with markdown text
 */
export function section(text: string): SectionBlock {
  return {
    type: 'section',
    text: { type: 'mrkdwn', text },
  };
}

/**
 * Create a divider block
 */
export function divider(): DividerBlock {
  return { type: 'divider' };
}

/**
 * Create a header block
 */
export function header(text: string): HeaderBlock {
  return {
    type: 'header',
    text: { type: 'plain_text', text, emoji: true },
  };
}

/**
 * Create a context block with text elements
 */
export function context(...texts: string[]): ContextBlock {
  return {
    type: 'context',
    elements: texts.map((text) => ({ type: 'mrkdwn' as const, text })),
  };
}
