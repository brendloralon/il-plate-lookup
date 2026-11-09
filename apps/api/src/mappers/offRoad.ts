import { z } from 'zod';
import { isoDate, optString, parseRecords } from './common';

export interface OffRoadRecord {
  cancelledOn: string | null;
  vehicleTypeRaw: string | null;
}

/** Works for the current resource (typed columns) and the legacy text-only ones. */
const offRoadRecordSchema = z.object({
  bitul_dt: optString,
  sug_rechev_nm: optString,
});

export function mapOffRoad(records: unknown[]): OffRoadRecord[] {
  return parseRecords(offRoadRecordSchema, records).map((r) => ({
    cancelledOn: isoDate(r.bitul_dt),
    vehicleTypeRaw: r.sug_rechev_nm,
  }));
}
