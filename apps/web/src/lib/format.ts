import type { Lang } from './messages';

const locale = (lang: Lang) => (lang === 'he' ? 'he-IL' : 'en-GB');

/** `YYYY-MM-DD` → `DD/MM/YYYY`, `YYYY-MM` → `MM/YYYY`, `YYYY` unchanged. */
export function formatDate(value: string | null): string | null {
  if (!value) return null;
  const [y, m, d] = value.split('-');
  if (d && m) return `${d}/${m}/${y}`;
  if (m) return `${m}/${y}`;
  return y ?? null;
}

export function formatNumber(value: number | null, lang: Lang): string | null {
  if (value === null) return null;
  return new Intl.NumberFormat(locale(lang)).format(value);
}

export function formatDateTime(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(iso),
  );
}
