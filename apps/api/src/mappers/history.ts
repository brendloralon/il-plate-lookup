import { z } from 'zod';
import type { History } from '@app/shared';
import { isoDate, optFlag, optNumber, optString, parseRecords } from './common';

const historyRecordSchema = z.object({
  mispar_manoa: optString,
  kilometer_test_aharon: optNumber,
  shinui_mivne_ind: optFlag,
  gapam_ind: optFlag,
  shnui_zeva_ind: optFlag,
  shinui_zmig_ind: optFlag,
  rishum_rishon_dt: optString,
  mkoriut_nm: optString,
});

export function mapHistory(records: unknown[]): History[] {
  return parseRecords(historyRecordSchema, records).map((r) => ({
    mileageAtLastTest: r.kilometer_test_aharon,
    firstRegistrationDate: isoDate(r.rishum_rishon_dt),
    originRaw: r.mkoriut_nm,
    engineNumber: r.mispar_manoa,
    structuralChange: r.shinui_mivne_ind,
    lpgConversion: r.gapam_ind,
    colorChanged: r.shnui_zeva_ind,
    tireSizeChanged: r.shinui_zmig_ind,
  }));
}
