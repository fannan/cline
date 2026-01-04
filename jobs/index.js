/**
 * Job Framework - Instrumented job execution with optional D1 logging and Slack notifications
 *
 * @module @cline/core/jobs
 * @exports Job - Base class to extend for your jobs
 * @exports setupJobsTable - One-time schema setup function
 *
 * ## Quick Start
 *
 *   import { Job, setupJobsTable } from '@cline/core/jobs';
 *
 *   // One-time setup (creates job_runs and sync_state tables)
 *   await setupJobsTable(db);
 *
 *   // Define a job
 *   class MySync extends Job {
 *     static config = {
 *       name: 'my-sync',
 *       slack: {                          // Optional - enables Slack notifications
 *         channel: 'C0A5PCREQPP',
 *         username: 'My Bot',
 *         icon_emoji: ':robot_face:',
 *         heartbeat: true                 // Track quiet runs with visual dots
 *       }
 *     };
 *
 *     async run(context) {
 *       // context.db - D1 client (if provided)
 *       // context.runId - this run's ID (if D1 enabled)
 *       // context.log(msg) - structured logging
 *
 *       const results = await this.doWork();
 *       return {
 *         ...results,
 *         notable: results.changes > 0   // Tells heartbeat when to reset
 *       };
 *     }
 *   }
 *
 *   // Execute with full instrumentation
 *   const job = new MySync({ db, slack });
 *   await job.execute();
 *
 * ## Flexibility - Pass What You Need
 *
 *   new MySync({ db, slack })  // Full: D1 logging + Slack notifications
 *   new MySync({ db })         // D1 logging only, no Slack
 *   new MySync({ slack })      // Slack only, no D1 persistence
 *   new MySync()               // Bare execution, stdout logging only
 *
 * ## Lifecycle
 *
 *   1. execute() creates job_runs record (status: 'running')
 *   2. Calls your run() method
 *   3. On success: updates record (status: 'completed', output_data: JSON)
 *   4. On error: updates record (status: 'failed', error_message)
 *   5. Handles Slack notifications based on config
 *
 * ## Heartbeat Feature
 *
 *   When slack.heartbeat: true, quiet runs (notable: false) show a visual indicator:
 *
 *     ✓ my-sync • No updates
 *     ••••••••••
 *     12 runs since last update (2h 15m)
 *
 *   When a notable update occurs (notable: true), the heartbeat resets.
 *
 * ## Tables Created by setupJobsTable()
 *
 *   job_runs: id, job_name, started_at, completed_at, status, output_data, error_message
 *   sync_state: key, value, updated_at (used for heartbeat state)
 */

import { blocks } from '../slack/index.js';

// ============================================================================
// Schema Setup
// ============================================================================

const JOB_RUNS_SCHEMA = `
CREATE TABLE IF NOT EXISTS job_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_name TEXT NOT NULL,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    status TEXT DEFAULT 'running',
    output_data TEXT,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_job_runs_job_name ON job_runs(job_name);
CREATE INDEX IF NOT EXISTS idx_job_runs_status ON job_runs(status);
`;

const SYNC_STATE_SCHEMA = `
CREATE TABLE IF NOT EXISTS sync_state (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);
`;

/**
 * Set up job framework tables in D1
 * @param {Object} db - D1 client from @cline/core/d1
 * @returns {Promise<{jobRuns: boolean, syncState: boolean}>} Tables created/exist status
 */
export async function setupJobsTable(db) {
    // Split into individual statements (D1 doesn't support multiple statements)
    const jobRunsStatements = JOB_RUNS_SCHEMA.trim().split(';').filter(s => s.trim());
    const syncStateStatements = SYNC_STATE_SCHEMA.trim().split(';').filter(s => s.trim());

    for (const sql of jobRunsStatements) {
        if (sql.trim()) await db.execute(sql);
    }
    for (const sql of syncStateStatements) {
        if (sql.trim()) await db.execute(sql);
    }

    return { jobRuns: true, syncState: true };
}

// ============================================================================
// Job Base Class
// ============================================================================

const MAX_HEARTBEAT_DOTS = 50;

export class Job {
    /**
     * Static config - override in subclass
     * @type {{ name: string, slack?: { channel: string, username?: string, icon_emoji?: string, heartbeat?: boolean } }}
     */
    static config = {
        name: 'unnamed-job',
        slack: null
    };

    /**
     * Create a job instance
     * @param {Object} options
     * @param {Object} [options.db] - D1 client for job_runs logging
     * @param {Object} [options.slack] - Slack client for notifications
     */
    constructor({ db, slack } = {}) {
        this.db = db;
        this.slack = slack;
        this.runId = null;
    }

    /**
     * Get job config (from static property)
     */
    get config() {
        return this.constructor.config;
    }

    /**
     * Execute the job with full lifecycle management
     * @returns {Promise<Object>} Job result
     */
    async execute() {
        const startTime = Date.now();
        let result = null;
        let error = null;

        // Create job_runs record if D1 enabled
        if (this.db) {
            this.runId = await this._createJobRun();
        }

        const context = {
            db: this.db,
            runId: this.runId,
            log: (msg) => console.log(`[${this.config.name}] ${msg}`)
        };

        try {
            // Run the job
            context.log('Starting...');
            result = await this.run(context);
            context.log(`Completed in ${Date.now() - startTime}ms`);

            // Update job_runs with success
            if (this.db && this.runId) {
                await this._completeJobRun(result);
            }

            // Handle Slack notifications
            if (this.slack && this.config.slack) {
                await this._handleSlackNotification(result, null);
            }

            return result;

        } catch (err) {
            error = err;
            context.log(`Failed: ${err.message}`);

            // Update job_runs with failure
            if (this.db && this.runId) {
                await this._failJobRun(err.message);
            }

            // Send error notification
            if (this.slack && this.config.slack) {
                await this._handleSlackNotification(null, err);
            }

            throw err;
        }
    }

    /**
     * Override this method in subclass
     * @param {Object} context - { db, runId, log }
     * @returns {Promise<Object>} Output data (include `notable: boolean` for heartbeat)
     */
    async run(context) {
        throw new Error('Job.run() must be implemented by subclass');
    }

    // ========================================================================
    // D1 Job Runs
    // ========================================================================

    async _createJobRun() {
        const result = await this.db.execute(
            `INSERT INTO job_runs (job_name, status) VALUES (?, 'running')`,
            [this.config.name]
        );
        // D1 returns last_row_id in meta
        return result.last_row_id || result.lastRowId;
    }

    async _completeJobRun(outputData) {
        await this.db.execute(
            `UPDATE job_runs
             SET status = 'completed',
                 completed_at = datetime('now'),
                 output_data = ?
             WHERE id = ?`,
            [JSON.stringify(outputData), this.runId]
        );
    }

    async _failJobRun(errorMessage) {
        await this.db.execute(
            `UPDATE job_runs
             SET status = 'failed',
                 completed_at = datetime('now'),
                 error_message = ?
             WHERE id = ?`,
            [errorMessage, this.runId]
        );
    }

    // ========================================================================
    // Slack Notifications
    // ========================================================================

    async _handleSlackNotification(result, error) {
        const slackConfig = this.config.slack;
        if (!slackConfig) return;

        if (error) {
            await this._postErrorNotification(error);
        } else if (result?.notable) {
            // Notable update - reset heartbeat, let caller handle notification
            if (slackConfig.heartbeat) {
                await this._resetHeartbeat();
            }
            // Note: Caller is responsible for posting notable update messages
            // Framework just handles heartbeat reset
        } else if (slackConfig.heartbeat) {
            // Quiet run - update heartbeat
            await this._updateHeartbeat();
        }
    }

    async _postErrorNotification(error) {
        const slackConfig = this.config.slack;
        const messageBlocks = [
            blocks.header(`⚠️ ${this.config.name} failed`),
            blocks.section(`\`\`\`${error.message}\`\`\``)
        ];

        await this.slack.post(messageBlocks, {
            text: `${this.config.name} failed: ${error.message}`,
            channel: slackConfig.channel,
            username: slackConfig.username,
            icon_emoji: slackConfig.icon_emoji
        });
    }

    // ========================================================================
    // Heartbeat
    // ========================================================================

    _heartbeatKey() {
        return `job:${this.config.name}:heartbeat`;
    }

    async _getHeartbeatState() {
        if (!this.db) return null;
        const row = await this.db.queryOne(
            `SELECT value FROM sync_state WHERE key = ?`,
            [this._heartbeatKey()]
        );
        return row ? JSON.parse(row.value) : null;
    }

    async _setHeartbeatState(state) {
        if (!this.db) return;
        await this.db.execute(
            `INSERT OR REPLACE INTO sync_state (key, value, updated_at)
             VALUES (?, ?, datetime('now'))`,
            [this._heartbeatKey(), JSON.stringify(state)]
        );
    }

    async _resetHeartbeat() {
        if (!this.db) return;
        await this.db.execute(
            `DELETE FROM sync_state WHERE key = ?`,
            [this._heartbeatKey()]
        );
        console.log(`[${this.config.name}] Heartbeat reset`);
    }

    async _updateHeartbeat() {
        const slackConfig = this.config.slack;
        const state = await this._getHeartbeatState();

        if (state) {
            // Update existing heartbeat
            const newCount = state.run_count + 1;
            const messageBlocks = await this._buildHeartbeatBlocks(newCount, state.started_at);

            const result = await this.slack.update(
                state.message_ts,
                messageBlocks,
                {
                    text: `${this.config.name} • ${newCount} quiet runs`,
                    channel: slackConfig.channel
                }
            );

            if (result?.ok) {
                await this._setHeartbeatState({
                    message_ts: state.message_ts,
                    run_count: newCount,
                    started_at: state.started_at
                });
                console.log(`[${this.config.name}] Heartbeat: ${newCount} quiet runs`);
            } else {
                // Message deleted, create new
                await this._createHeartbeat();
            }
        } else {
            // First quiet run
            await this._createHeartbeat();
        }
    }

    async _createHeartbeat() {
        const slackConfig = this.config.slack;
        const now = new Date().toISOString();
        const messageBlocks = await this._buildHeartbeatBlocks(1, now);

        const result = await this.slack.post(messageBlocks, {
            text: `${this.config.name} • 1 quiet run`,
            channel: slackConfig.channel,
            username: slackConfig.username,
            icon_emoji: slackConfig.icon_emoji
        });

        if (result?.ok) {
            await this._setHeartbeatState({
                message_ts: result.ts,
                run_count: 1,
                started_at: now
            });
            console.log(`[${this.config.name}] Heartbeat: first quiet run`);
        }
    }

    async _getLastSyncTime() {
        if (!this.db) return null;
        const row = await this.db.queryOne(
            `SELECT completed_at FROM job_runs
             WHERE job_name = ? AND status = 'completed'
             ORDER BY completed_at DESC LIMIT 1`,
            [this.config.name]
        );
        return row?.completed_at || null;
    }

    _formatTime(date) {
        // Format as "12:41pm"
        let hours = date.getHours();
        const mins = date.getMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12 || 12;
        const minsStr = mins < 10 ? `0${mins}` : mins;
        return `${hours}:${minsStr}${ampm}`;
    }

    async _buildHeartbeatBlocks(runCount, startedAt) {
        const dotCount = Math.min(runCount, MAX_HEARTBEAT_DOTS);
        const dots = '•'.repeat(dotCount);

        // Get last sync time
        const lastSyncTime = await this._getLastSyncTime();
        let lastSyncText = '';
        if (lastSyncTime) {
            const lastSync = new Date(lastSyncTime + 'Z'); // D1 stores without timezone
            lastSyncText = ` • Last Sync: ${this._formatTime(lastSync)}`;
        }

        const caption = `${runCount} ${runCount === 1 ? 'run' : 'runs'} since last update${lastSyncText}`;

        return [
            blocks.section(`:runner: ${this.config.name}`),
            blocks.section(dots || '•'),
            blocks.context(caption)
        ];
    }
}
