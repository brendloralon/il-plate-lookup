const DAY_MS = 86_400_000;

function utcDay(isoDate: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Whole days from `today` until `isoDate` (negative when in the past). */
export function daysUntil(isoDate: string, today: Date): number | null {
  const target = utcDay(isoDate);
  if (target === null) return null;
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - now) / DAY_MS);
}
