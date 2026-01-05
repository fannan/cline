/**
 * Date and Time Formatting Utilities
 */

/**
 * Format a date as relative time (e.g., "30s ago", "5m ago").
 *
 * @param {string|Date} dateInput - Date string (ISO format) or Date object
 * @param {Object} [options={}] - Formatting options
 * @param {boolean} [options.assumeUTC=true] - Whether to treat string input as UTC
 * @returns {string} Relative time string like "30s ago" or "5m ago"
 *
 * @example
 * formatTimeAgo('2025-01-05T12:00:00')      // "5m ago" (if now is 12:05)
 * formatTimeAgo(new Date())                 // "just now"
 * formatTimeAgo(null)                       // "-"
 */
export function formatTimeAgo(dateInput, options = {}) {
  const { assumeUTC = true } = options;

  if (!dateInput) return '-';

  let date;
  if (typeof dateInput === 'string') {
    // If string doesn't end with Z and assumeUTC is true, append Z
    const dateStr = assumeUTC && !dateInput.endsWith('Z')
      ? dateInput + 'Z'
      : dateInput;
    date = new Date(dateStr);
  } else {
    date = dateInput;
  }

  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 0) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Format a date as relative time with more granularity.
 *
 * @param {string|Date} dateInput - Date string or Date object
 * @param {Object} [options={}] - Formatting options
 * @param {boolean} [options.assumeUTC=true] - Whether to treat string input as UTC
 * @param {boolean} [options.short=true] - Use short format (5m) vs long (5 minutes)
 * @returns {string} Relative time string
 */
export function formatTimeAgoLong(dateInput, options = {}) {
  const { assumeUTC = true, short = false } = options;

  if (!dateInput) return '-';

  let date;
  if (typeof dateInput === 'string') {
    const dateStr = assumeUTC && !dateInput.endsWith('Z')
      ? dateInput + 'Z'
      : dateInput;
    date = new Date(dateStr);
  } else {
    date = dateInput;
  }

  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 0) return 'just now';

  const units = [
    { threshold: 60, divisor: 1, short: 's', long: 'second' },
    { threshold: 3600, divisor: 60, short: 'm', long: 'minute' },
    { threshold: 86400, divisor: 3600, short: 'h', long: 'hour' },
    { threshold: 604800, divisor: 86400, short: 'd', long: 'day' },
    { threshold: 2592000, divisor: 604800, short: 'w', long: 'week' },
    { threshold: 31536000, divisor: 2592000, short: 'mo', long: 'month' },
    { threshold: Infinity, divisor: 31536000, short: 'y', long: 'year' },
  ];

  for (const unit of units) {
    if (seconds < unit.threshold) {
      const value = Math.floor(seconds / unit.divisor);
      if (short) {
        return `${value}${unit.short} ago`;
      }
      const plural = value === 1 ? '' : 's';
      return `${value} ${unit.long}${plural} ago`;
    }
  }

  return 'a long time ago';
}
