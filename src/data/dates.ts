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
