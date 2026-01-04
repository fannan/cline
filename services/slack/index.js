/**
 * Slack Block Kit Client
 *
 * Usage:
 *   import { createSlackClient } from '../shared/slack/index.js';
 *   const slack = createSlackClient({
 *       token: process.env.SLACK_BOT_TOKEN,
 *       defaultChannel: process.env.SLACK_CHANNEL
 *   });
 *   await slack.post(blocks, { text: 'Update' });
 */

/**
 * Create a Slack client
 */
export function createSlackClient({ token, defaultChannel }) {
  return {
    /**
     * Post a message to Slack using Block Kit
     * @param {Array} blocks - Slack Block Kit blocks
     * @param {Object} options - Message options
     * @param {string} options.text - Fallback text for notifications
     * @param {string} options.channel - Override default channel
     * @param {string} options.username - Bot username
     * @param {string} options.icon_emoji - Bot icon emoji
     * @returns {Promise<Object>} Slack API response
     */
    async post(blocks, options = {}) {
      const {
        text = 'Update',
        channel = defaultChannel,
        username,
        icon_emoji
      } = options;

      if (!token || !channel) {
        console.log('Slack not configured, skipping notification');
        return null;
      }

      const body = {
        channel,
        text,
        blocks
      };

      if (username) body.username = username;
      if (icon_emoji) body.icon_emoji = icon_emoji;

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (!result.ok) {
        console.error('Slack error:', result.error);
      }
      return result;
    },

    /**
     * Delete messages from a channel (bot's own messages only)
     * @param {string} channelId - Channel ID
     * @param {number} limit - Max messages to fetch per batch
     * @returns {Promise<{deleted: number, failed: number}>}
     */
    async clearChannel(channelId, limit = 200) {
      let deleted = 0;
      let failed = 0;
      let cursor = null;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({ channel: channelId, limit: String(limit) });
        if (cursor) params.append('cursor', cursor);

        const historyRes = await fetch(`https://slack.com/api/conversations.history?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const history = await historyRes.json();

        if (!history.ok || !history.messages?.length) break;

        for (const msg of history.messages) {
          // Skip system messages
          if (['channel_join', 'channel_leave', 'channel_purpose', 'channel_topic'].includes(msg.subtype)) {
            continue;
          }

          const delRes = await fetch('https://slack.com/api/chat.delete', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ channel: channelId, ts: msg.ts })
          });
          const delResult = await delRes.json();

          if (delResult.ok) {
            deleted++;
          } else {
            failed++;
          }

          // Rate limit protection
          await new Promise(r => setTimeout(r, 100));
        }

        cursor = history.response_metadata?.next_cursor;
        hasMore = !!cursor;
      }

      return { deleted, failed };
    }
  };
}
