/** Date-only helpers. All arithmetic is local-timezone based.
 *  Never use `new Date().toISOString().split('T')[0]` — that returns a UTC date
 *  which can be the wrong calendar day for users east or west of UTC.
 */

/** Returns YYYY-MM-DD in the user's LOCAL timezone. */
export function getLocalDateString(date = new Date()): string {
  return dateKey(date);
}

/** Core local date → YYYY-MM-DD string. Parsing YYYY-MM-DD with Date() treats it as
 *  UTC and can shift streaks, so keep all calendar arithmetic string-based.
 */
export function dateKey(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Parse a YYYY-MM-DD string into a LOCAL midnight Date (not UTC midnight). */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Add (or subtract) N calendar days from a YYYY-MM-DD string, returns YYYY-MM-DD. */
export function addLocalDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

/** Returns the previous calendar day as YYYY-MM-DD. */
export function previousDate(dateStr: string): string {
  return addLocalDays(dateStr, -1);
}

/** Human-readable label: "Today", "Yesterday", "Tomorrow", or e.g. "Wed, Sep 17". */
export function formatLocalDate(dateStr: string): string {
  const today = getLocalDateString();
  if (dateStr === today) return 'Today';
  if (dateStr === addLocalDays(today, -1)) return 'Yesterday';
  if (dateStr === addLocalDays(today, 1)) return 'Tomorrow';
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Returns true if the given YYYY-MM-DD string is today in local time. */
export function isLocalToday(dateStr: string): boolean {
  return dateStr === getLocalDateString();
}

/** Compute an active streak from a list of YYYY-MM-DD completed dates. */
export function calculateActiveStreak(completedDates: string[], now = new Date()): number {
  const dates = [...new Set(completedDates)].sort().reverse();
  if (dates.length === 0) return 0;

  const today = dateKey(now);
  const yesterday = previousDate(today);
  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 0;
  let expected = dates[0];
  for (const date of dates) {
    if (date !== expected) break;
    streak++;
    expected = previousDate(expected);
  }
  return streak;
}
