import { z } from 'zod';
import type { FuelType, OwnershipType } from '@app/shared';

/**
 * Trimmed string with runs of whitespace collapsed, or null when missing/blank.
 * Accepts numbers (legacy text/numeric drift).
 */
export const optString = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined) return null;
    const t = String(v).replace(/\s+/g, ' ').trim();
    return t === '' ? null : t;
  });

/** Finite number, or null. Accepts numeric strings (legacy resources store everything as text). */
export const optNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    const t = v.trim();
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  });

/** 0/1 indicator columns. */
export const optFlag = optNumber.transform((n) => (n === null ? null : n === 1));

/** `YYYY-MM-DD` (optionally followed by a time) → `YYYY-MM-DD`. */
export function isoDate(value: string | null): string | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Numeric `YYYYMMDD` → `YYYY-MM-DD`. */
export function compactDate(value: number | null): string | null {
  if (value === null) return null;
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(String(value));
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Numeric `YYYYMM` → `YYYY-MM`. */
export function compactMonth(value: number | null): string | null {
  if (value === null) return null;
  const m = /^(\d{4})(\d{2})$/.exec(String(value));
  return m ? `${m[1]}-${m[2]}` : null;
}

/** `YYYY-M` / `YYYY-MM` / `YYYY` → `YYYY-MM` or `YYYY`. */
export function looseMonth(value: string | null): string | null {
  if (!value) return null;
  const m = /^(\d{4})(?:-(\d{1,2}))?$/.exec(value);
  if (!m) return null;
  return m[2] ? `${m[1]}-${m[2].padStart(2, '0')}` : (m[1] ?? null);
}

export function mapFuel(raw: string | null): FuelType | null {
  if (!raw) return null;
  const hasElectric = raw.includes('חשמל');
  if (hasElectric && (raw.includes('/') || raw.includes('היבריד'))) return 'hybrid';
  if (raw.includes('היבריד')) return 'hybrid';
  if (hasElectric) return 'electric';
  if (raw.includes('בנזין')) return 'petrol';
  if (raw.includes('דיזל') || raw.includes('סולר')) return 'diesel';
  if (raw.includes('גפ"מ') || raw.includes('גז')) return 'lpg';
  return 'other';
}

const OWNERSHIP_TYPES: Record<string, OwnershipType> = {
  פרטי: 'private',
  חברה: 'company',
  ליסינג: 'leasing',
  השכרה: 'rental',
  סוחר: 'dealer',
  החכר: 'hireLease',
};

export function mapOwnershipType(raw: string | null): OwnershipType | null {
  if (!raw) return null;
  return OWNERSHIP_TYPES[raw] ?? 'other';
}

/** Run a record schema over a CKAN `records` array. Throws ZodError on unexpected shapes. */
export function parseRecords<S extends z.ZodTypeAny>(schema: S, records: unknown[]): z.output<S>[] {
  return z.array(schema).parse(records);
}
