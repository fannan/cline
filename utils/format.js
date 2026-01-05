/**
 * Number and Currency Formatting Utilities
 */

/**
 * Format a number with K/M suffixes for readability.
 *
 * @param {number} num - The number to format
 * @param {string} [prefix='$'] - Prefix to add (e.g., '$', '', '€')
 * @returns {string} Formatted string like "$1.5K" or "$2.3M"
 *
 * @example
 * formatAmount(1500)         // "$1.5K"
 * formatAmount(2300000)      // "$2.3M"
 * formatAmount(500, '')      // "500"
 * formatAmount(1500, '€')    // "€1.5K"
 */
export function formatAmount(num, prefix = '$') {
  if (num >= 1000000) {
    return `${prefix}${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${prefix}${(num / 1000).toFixed(1)}K`;
  }
  return `${prefix}${Math.round(num)}`;
}
