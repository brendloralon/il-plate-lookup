import { z } from 'zod';
import { compactDate, optNumber, parseRecords } from './common';

export interface DisabledPermitRecord {
  issuedOn: string | null;
  permitType: number | null;
}

const disabledPermitRecordSchema = z.object({
  'TAARICH HAFAKAT TAG': optNumber,
  'SUG TAV': optNumber,
});

export function mapDisabledPermit(records: unknown[]): DisabledPermitRecord[] {
  return parseRecords(disabledPermitRecordSchema, records).map((r) => ({
    issuedOn: compactDate(r['TAARICH HAFAKAT TAG']),
    permitType: r['SUG TAV'],
  }));
}
