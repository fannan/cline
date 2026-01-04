/**
 * @marcella/dates
 * Date utilities with configurable timezone support and DST handling
 */

/**
 * Parsed time result
 */
export interface ParsedTime {
  hours: number;
  minutes: number;
}

/**
 * Date range result
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Timezone-specific date utilities
 */
export interface DateUtils {
  /**
   * Get the UTC offset string for a date (handles DST)
   * @example
   * const utils = createDateUtils('America/Los_Angeles');
   * utils.getOffset(new Date('2024-06-15')); // '-07:00' (PDT)
   * utils.getOffset(new Date('2024-01-15')); // '-08:00' (PST)
   */
  getOffset(date: Date): string;

  /**
   * Format a date in the configured timezone for display
   * @example
   * const utils = createDateUtils('America/Los_Angeles');
   * utils.formatTime(new Date()); // 'Jan 3, 10:30 AM'
   */
  formatTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string;

  /**
   * Get the timezone name for a date (e.g., 'PST', 'PDT')
   */
  getTimezoneName(date: Date): string;
}

/**
 * Create timezone-specific date utilities
 *
 * @param timezone - IANA timezone identifier (e.g., 'America/Los_Angeles', 'America/New_York')
 * @returns Object with timezone-aware date utilities
 *
 * @example
 * ```ts
 * const pacific = createDateUtils('America/Los_Angeles');
 * const eastern = createDateUtils('America/New_York');
 *
 * // Get offset for a specific date (handles DST automatically)
 * pacific.getOffset(new Date('2024-06-15')); // '-07:00'
 * pacific.getOffset(new Date('2024-01-15')); // '-08:00'
 *
 * // Format for display
 * pacific.formatTime(new Date()); // 'Jan 3, 10:30 AM'
 * ```
 */
export function createDateUtils(timezone: string = 'UTC'): DateUtils {
  return {
    getOffset(date: Date): string {
      // Create a formatter that outputs the GMT offset
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'longOffset',
      });

      const parts = formatter.formatToParts(date);
      const offsetPart = parts.find((p) => p.type === 'timeZoneName');

      if (!offsetPart) return '+00:00';

      // Convert 'GMT-7' or 'GMT-07:00' to '-07:00'
      const match = offsetPart.value.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
      if (!match) return '+00:00';

      const sign = match[1];
      const hours = match[2]?.padStart(2, '0') ?? '00';
      const minutes = match[3] ?? '00';

      return `${sign}${hours}:${minutes}`;
    },

    formatTime(
      date: Date | string,
      options: Intl.DateTimeFormatOptions = {}
    ): string {
      const d = typeof date === 'string' ? new Date(date) : date;
      const defaultOptions: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      };
      return d.toLocaleString('en-US', { ...defaultOptions, ...options });
    },

    getTimezoneName(date: Date): string {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short',
      });
      const parts = formatter.formatToParts(date);
      return parts.find((p) => p.type === 'timeZoneName')?.value ?? timezone;
    },
  };
}

// Pre-configured Pacific timezone utilities for convenience
const pacificUtils = createDateUtils('America/Los_Angeles');

/**
 * Get Pacific timezone offset string for a given date (handles DST)
 * @deprecated Use createDateUtils('America/Los_Angeles').getOffset() instead
 * @param date - Date to get offset for
 * @returns '-07:00' for PDT or '-08:00' for PST
 */
export function getPacificOffset(date: Date): string {
  return pacificUtils.getOffset(date);
}

/**
 * Format a date in Pacific time for display
 * @deprecated Use createDateUtils('America/Los_Angeles').formatTime() instead
 */
export function formatPacificTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  return pacificUtils.formatTime(date, options);
}

// ============================================
// Timezone-agnostic utilities (always work)
// ============================================

/**
 * Format date as MM/DD/YYYY
 *
 * @example
 * formatDateUS(new Date('2024-01-15')); // '01/15/2024'
 */
export function formatDateUS(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Format date as YYYY-MM-DD (ISO date only)
 *
 * @example
 * formatDateISO(new Date('2024-01-15T10:30:00')); // '2024-01-15'
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

/**
 * Parse a time string like "8:30 am" or "9:00 pm" into hours and minutes
 *
 * @example
 * parseTimeString('8:30 am');  // { hours: 8, minutes: 30 }
 * parseTimeString('9:00 pm');  // { hours: 21, minutes: 0 }
 * parseTimeString('12:00 pm'); // { hours: 12, minutes: 0 }
 * parseTimeString('12:00 am'); // { hours: 0, minutes: 0 }
 */
export function parseTimeString(timeStr: string): ParsedTime | null {
  if (!timeStr) return null;

  const match = timeStr.trim().match(/(\d+):(\d+)\s*(am|pm)/i);
  if (!match) return null;

  let hours = parseInt(match[1] ?? '0', 10);
  const minutes = parseInt(match[2] ?? '0', 10);
  const period = match[3]?.toLowerCase();

  if (period === 'pm' && hours !== 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;

  return { hours, minutes };
}

/**
 * Create a date range from today
 *
 * @param daysBack - Days before today (negative or 0, default: 0)
 * @param daysForward - Days after today (default: 7)
 * @returns Object with start and end dates
 *
 * @example
 * // Get past week
 * getDateRange(-7, 0);
 *
 * // Get next 30 days
 * getDateRange(0, 30);
 *
 * // Get 7 days before and after today
 * getDateRange(-7, 7);
 */
export function getDateRange(daysBack = 0, daysForward = 7): DateRange {
  const start = new Date();
  start.setDate(start.getDate() + daysBack);
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setDate(end.getDate() + daysForward);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffDay) >= 1) {
    return rtf.format(diffDay, 'day');
  }
  if (Math.abs(diffHour) >= 1) {
    return rtf.format(diffHour, 'hour');
  }
  if (Math.abs(diffMin) >= 1) {
    return rtf.format(diffMin, 'minute');
  }
  return rtf.format(diffSec, 'second');
}
