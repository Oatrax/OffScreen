/** Local-date key, YYYY-MM-DD. */
export function dayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export const ALL_DAYS = 0b1111111;

export function runsOn(recurrence: number, d: Date = new Date()): boolean {
  return (recurrence & (1 << d.getDay())) !== 0;
}

export const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function describeRecurrence(recurrence: number): string {
  if (recurrence === ALL_DAYS) return 'Every day';
  return WEEKDAY_NAMES.filter((_, i) => recurrence & (1 << i)).join(', ');
}
