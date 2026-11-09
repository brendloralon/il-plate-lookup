import { z } from 'zod';
import type { OwnershipEntry } from '@app/shared';
import { compactMonth, mapOwnershipType, optNumber, optString, parseRecords } from './common';

const ownershipRecordSchema = z.object({
  _id: optNumber,
  baalut_dt: optNumber,
  baalut: optString,
});

/** Ownership periods, oldest first. Rows without a date or type are dropped. */
export function mapOwnership(records: unknown[]): OwnershipEntry[] {
  return parseRecords(ownershipRecordSchema, records)
    .flatMap((r) => {
      const since = compactMonth(r.baalut_dt);
      const type = mapOwnershipType(r.baalut);
      if (!since || !type || !r.baalut) return [];
      return [{ since, type, typeRaw: r.baalut, order: r._id ?? 0 }];
    })
    .sort((a, b) => a.since.localeCompare(b.since) || a.order - b.order)
    .map(({ since, type, typeRaw }) => ({ since, type, typeRaw }));
}
