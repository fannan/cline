/**
 * Generic Slack client with Block Kit helpers
 *
 * Usage:
 *   import { createSlackClient, blocks } from '@marcella/slack';
 *
 *   const slack = createSlackClient({
 *       token: process.env.SLACK_BOT_TOKEN,
 *       defaultChannel: process.env.SLACK_CHANNEL
 *   });
 *
 *   await slack.post([
 *       blocks.header('🆕 New Item'),
 *       blocks.fields(['Status', 'Active'], ['Priority', 'High']),
 *       blocks.section('Details here...'),
 *       blocks.button('View', 'https://example.com', 'view_btn'),
 *       blocks.divider()
 *   ], { text: 'New item notification' });
 */

/**
 * Block Kit helpers for building Slack messages
 */
export const blocks = {
    /**
     * Create a header block
     * @param {string} text - Header text (supports emoji)
     */
    header: (text) => ({
        type: 'header',
        text: { type: 'plain_text', text, emoji: true }
    }),

    /**
     * Create a section block with markdown text
     * @param {string} text - Markdown text
     */
    section: (text) => ({
        type: 'section',
        text: { type: 'mrkdwn', text }
    }),

    /**
     * Create a section with field pairs (two-column layout)
     * @param {...[string, string]} pairs - [label, value] pairs
     * @example blocks.fields(['Status', 'Active'], ['Date', 'Jan 4'])
     */
    fields: (...pairs) => ({
        type: 'section',
        fields: pairs.map(([label, value]) => ({
            type: 'mrkdwn',
            text: `*${label}*\n${value}`
        }))
    }),

    /**
     * Create a context block (secondary/muted text)
     * @param {string} text - Markdown text
     */
    context: (text) => ({
        type: 'context',
        elements: [{ type: 'mrkdwn', text }]
    }),

    /**
     * Create an actions block with a button
     * @param {string} label - Button label (supports emoji)
     * @param {string} url - Button URL
     * @param {string} actionId - Unique action identifier
     */
    button: (label, url, actionId) => ({
        type: 'actions',
        elements: [{
            type: 'button',
            text: { type: 'plain_text', text: label, emoji: true },
            url,
            action_id: actionId
        }]
    }),

    /**
     * Create an image block
     * @param {string} url - Image URL
     * @param {string} alt - Alt text
     */
    image: (url, alt) => ({
        type: 'image',
        image_url: url,
        alt_text: alt
    }),

    /**
     * Create a divider block
     */
    divider: () => ({ type: 'divider' })
};

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
