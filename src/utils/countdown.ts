/**
 * Countdown formatting helpers shared across the app.
 */

/**
 * Convert an "HH:MM:SS" string to the mockup's "XH YM ZS" display format.
 * Falls back to the original string if parsing fails.
 */
export function formatMockupCountdown(timeStr: string): string {
  const parts = timeStr.split(':');
  if (parts.length !== 3) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parseInt(parts[2], 10);
  if (isNaN(h) || isNaN(m) || isNaN(s)) return timeStr;
  return `${h}H ${m}M ${s}S`;
}
