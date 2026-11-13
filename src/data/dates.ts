/** Local-date key, YYYY-MM-DD. */
export function dayKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Recurrence is a bitmask by Date.getDay(): bit0=Sun, bit1=Mon ... bit6=Sat. */
export const ALL_DAYS = 0b1111111;
export const WEEKDAYS = 0b0111110; // Mon-Fri
export const WEEKEND = 0b1000001; // Sat + Sun

export function runsOn(recurrence: number, d: Date = new Date()): boolean {
  return (recurrence & (1 << d.getDay())) !== 0;
}

/** Display order, Monday first. */
export const DAYS = [
  { bit: 1, label: 'Mon' },
  { bit: 2, label: 'Tue' },
  { bit: 3, label: 'Wed' },
  { bit: 4, label: 'Thu' },
  { bit: 5, label: 'Fri' },
  { bit: 6, label: 'Sat' },
  { bit: 0, label: 'Sun' },
] as const;

export function describeRecurrence(recurrence: number): string {
  if (recurrence === ALL_DAYS) return 'Every day';
  if (recurrence === WEEKDAYS) return 'Weekdays';
  if (recurrence === WEEKEND) return 'Weekend';
  if (recurrence === 0) return 'No days selected';
  return DAYS.filter((d) => recurrence & (1 << d.bit))
    .map((d) => d.label)
    .join(', ');
}
