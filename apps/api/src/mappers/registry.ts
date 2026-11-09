import { z } from 'zod';
import type { Registry, RegistryKind, Summary } from '@app/shared';
import {
  isoDate,
  looseMonth,
  mapFuel,
  mapOwnershipType,
  optNumber,
  optString,
  parseRecords,
} from './common';

export interface RegistryMatch {
  summary: Summary;
  registry: Registry;
}

export function buildRegistryMatch(
  kind: RegistryKind,
  summary: Partial<Summary>,
  registry: Partial<Omit<Registry, 'kind'>>,
): RegistryMatch {
  return {
    summary: {
      make: null,
      manufacturerRaw: null,
      model: null,
      commercialName: null,
      trim: null,
      year: null,
      colorRaw: null,
      fuel: mapFuel(summary.fuelRaw ?? null),
      fuelRaw: null,
      originRaw: null,
      countryOfManufacture: null,
      vehicleTypeRaw: null,
      ...summary,
    },
    registry: {
      kind,
      lastTestDate: null,
      licenseValidUntil: null,
      onRoadSince: null,
      currentOwnership: mapOwnershipType(registry.currentOwnershipRaw ?? null),
      currentOwnershipRaw: null,
      vin: null,
      engineModel: null,
      pollutionGroup: null,
      safetyEquipmentLevel: null,
      frontTire: null,
      rearTire: null,
      grossWeightKg: null,
      modelKey: null,
      ...registry,
    },
  };
}

/** Schema shared by the active registry and the inactive-with-model-code dataset. */
export const registryRecordSchema = z.object({
  mispar_rechev: optNumber,
  tozeret_cd: optNumber,
  sug_degem: optString,
  tozeret_nm: optString,
  degem_cd: optNumber,
  degem_nm: optString,
  ramat_gimur: optString,
  ramat_eivzur_betihuty: optNumber,
  kvutzat_zihum: optNumber,
  shnat_yitzur: optNumber,
  degem_manoa: optString,
  mivchan_acharon_dt: optString,
  tokef_dt: optString,
  baalut: optString,
  misgeret: optString,
  tzeva_rechev: optString,
  zmig_kidmi: optString,
  zmig_ahori: optString,
  sug_delek_nm: optString,
  moed_aliya_lakvish: optString,
  kinuy_mishari: optString,
});

export function mapRegistry(
  records: unknown[],
  kind: Extract<RegistryKind, 'registry' | 'inactive'>,
): RegistryMatch[] {
  return parseRecords(registryRecordSchema, records).map((r) =>
    buildRegistryMatch(
      kind,
      {
        make: r.tozeret_nm,
        manufacturerRaw: r.tozeret_nm,
        model: r.degem_nm,
        commercialName: r.kinuy_mishari,
        trim: r.ramat_gimur,
        year: r.shnat_yitzur,
        colorRaw: r.tzeva_rechev,
        fuelRaw: r.sug_delek_nm,
      },
      {
        lastTestDate: isoDate(r.mivchan_acharon_dt),
        licenseValidUntil: isoDate(r.tokef_dt),
        onRoadSince: looseMonth(r.moed_aliya_lakvish),
        currentOwnershipRaw: r.baalut,
        vin: r.misgeret,
        engineModel: r.degem_manoa,
        pollutionGroup: r.kvutzat_zihum,
        safetyEquipmentLevel: r.ramat_eivzur_betihuty,
        frontTire: r.zmig_kidmi,
        rearTire: r.zmig_ahori,
        modelKey:
          r.tozeret_cd !== null &&
          r.degem_cd !== null &&
          r.sug_degem !== null &&
          r.shnat_yitzur !== null
            ? {
                manufacturerCode: r.tozeret_cd,
                modelCode: r.degem_cd,
                modelType: r.sug_degem,
                year: r.shnat_yitzur,
              }
            : null,
      },
    ),
  );
}
