import { z } from 'zod';
import type { Specs } from '@app/shared';
import { optFlag, optNumber, optString, parseRecords } from './common';

const wltpRecordSchema = z.object({
  tozar: optString,
  tozeret_eretz_nm: optString,
  merkav: optString,
  nefah_manoa: optNumber,
  koah_sus: optNumber,
  automatic_ind: optFlag,
  hanaa_nm: optString,
  technologiat_hanaa_nm: optString,
  delek_nm: optString,
  mishkal_kolel: optNumber,
  mispar_dlatot: optNumber,
  mispar_moshavim: optNumber,
  kosher_grira_im_blamim: optNumber,
  kosher_grira_bli_blamim: optNumber,
  mispar_kariot_avir: optNumber,
  abs_ind: optFlag,
  bakarat_yatzivut_ind: optFlag,
  bakarat_stiya_menativ_ind: optFlag,
  nitur_merhak_milfanim_ind: optFlag,
  zihuy_holchey_regel_ind: optFlag,
  bakarat_shyut_adaptivit_ind: optFlag,
  zihuy_beshetah_nistar_ind: optFlag,
  matzlemat_reverse_ind: optFlag,
  ramat_eivzur_betihuty: optNumber,
  nikud_betihut: optNumber,
  kvutzat_zihum: optNumber,
  madad_yarok: optNumber,
  CO2_WLTP: optNumber,
  sug_tkina_nm: optString,
});

export interface SpecsMatch {
  specs: Specs;
  /** Clean make name ("טויוטה") and country, used to improve the summary. */
  make: string | null;
  country: string | null;
}

export function mapSpecs(records: unknown[]): SpecsMatch[] {
  return parseRecords(wltpRecordSchema, records).map((r) => ({
    make: r.tozar,
    country: r.tozeret_eretz_nm,
    specs: {
      bodyTypeRaw: r.merkav,
      engineCc: r.nefah_manoa || null,
      horsepower: r.koah_sus || null,
      automatic: r.automatic_ind,
      // "לא ידוע קוד" means the drive type is unknown.
      driveRaw: r.hanaa_nm === 'לא ידוע קוד' ? null : r.hanaa_nm,
      propulsionRaw: r.technologiat_hanaa_nm,
      fuelRaw: r.delek_nm,
      grossWeightKg: r.mishkal_kolel || null,
      doors: r.mispar_dlatot,
      seats: r.mispar_moshavim,
      towingBrakedKg: r.kosher_grira_im_blamim,
      towingUnbrakedKg: r.kosher_grira_bli_blamim,
      airbags: r.mispar_kariot_avir,
      abs: r.abs_ind,
      stabilityControl: r.bakarat_yatzivut_ind,
      laneDepartureControl: r.bakarat_stiya_menativ_ind,
      forwardDistanceMonitoring: r.nitur_merhak_milfanim_ind,
      pedestrianDetection: r.zihuy_holchey_regel_ind,
      adaptiveCruise: r.bakarat_shyut_adaptivit_ind,
      blindSpotDetection: r.zihuy_beshetah_nistar_ind,
      reverseCamera: r.matzlemat_reverse_ind,
      safetyEquipmentLevel: r.ramat_eivzur_betihuty,
      safetyScore: r.nikud_betihut,
      pollutionGroup: r.kvutzat_zihum,
      greenIndex: r.madad_yarok,
      co2Wltp: r.CO2_WLTP,
      homologationRaw: r.sug_tkina_nm,
    },
  }));
}
