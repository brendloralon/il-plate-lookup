import { z } from 'zod';
import { isoDate, looseMonth, optNumber, optString, parseRecords } from './common';
import { buildRegistryMatch, type RegistryMatch } from './registry';

/** Fallback registries: vehicles that aren't in the private & commercial registry. */

const motorcycleSchema = z.object({
  tozeret_nm: optString,
  tozeret_eretz_nm: optString,
  degem_nm: optString,
  shnat_yitzur: optNumber,
  sug_delek_nm: optString,
  mishkal_kolel: optNumber,
  mida_zmig_kidmi: optString,
  mida_zmig_ahori: optString,
  misgeret: optString,
  moed_aliya_lakvish: optString,
  sug_rechev_nm: optString,
  baalut: optString,
  mkoriut_nm: optString,
});

export function mapMotorcycle(records: unknown[]): RegistryMatch[] {
  return parseRecords(motorcycleSchema, records).map((r) =>
    buildRegistryMatch(
      'motorcycle',
      {
        make: r.tozeret_nm,
        manufacturerRaw: r.tozeret_nm,
        model: r.degem_nm,
        year: r.shnat_yitzur,
        fuelRaw: r.sug_delek_nm,
        originRaw: r.mkoriut_nm,
        countryOfManufacture: r.tozeret_eretz_nm,
        vehicleTypeRaw: r.sug_rechev_nm,
      },
      {
        onRoadSince: looseMonth(r.moed_aliya_lakvish),
        currentOwnershipRaw: r.baalut,
        vin: r.misgeret,
        frontTire: r.mida_zmig_kidmi,
        rearTire: r.mida_zmig_ahori,
        grossWeightKg: r.mishkal_kolel || null,
      },
    ),
  );
}

/** Heavy (>3.5t) and inactive-without-model-code datasets share most columns. */
const heavySchema = z.object({
  mispar_shilda: optString,
  shnat_yitzur: optNumber,
  tozeret_nm: optString,
  tozeret_eretz_nm: optString,
  sug_delek_nm: optString,
  mishkal_kolel: optNumber,
  degem_nm: optString,
  degem_manoa: optString,
  moed_aliya_lakvish: optString,
  kvutzat_sug_rechev: optString,
  zmig_kidmi: optString,
  zmig_ahori: optString,
});

export function mapHeavy(records: unknown[], kind: 'heavy' | 'inactiveNoModel'): RegistryMatch[] {
  return parseRecords(heavySchema, records).map((r) =>
    buildRegistryMatch(
      kind,
      {
        make: r.tozeret_nm,
        manufacturerRaw: r.tozeret_nm,
        model: r.degem_nm,
        year: r.shnat_yitzur,
        fuelRaw: r.sug_delek_nm,
        countryOfManufacture: r.tozeret_eretz_nm,
        vehicleTypeRaw: r.kvutzat_sug_rechev,
      },
      {
        onRoadSince: looseMonth(r.moed_aliya_lakvish),
        vin: r.mispar_shilda,
        engineModel: r.degem_manoa,
        frontTire: r.zmig_kidmi,
        rearTire: r.zmig_ahori,
        grossWeightKg: r.mishkal_kolel || null,
      },
    ),
  );
}

const personalImportSchema = z.object({
  shilda: optString,
  tozeret_nm: optString,
  sug_rechev_nm: optString,
  degem_nm: optString,
  mishkal_kolel: optNumber,
  shnat_yitzur: optNumber,
  tozeret_eretz_nm: optString,
  degem_manoa: optString,
  mivchan_acharon_dt: optString,
  tokef_dt: optString,
  sug_yevu: optString,
  moed_aliya_lakvish: optString,
  sug_delek_nm: optString,
});

export function mapPersonalImport(records: unknown[]): RegistryMatch[] {
  return parseRecords(personalImportSchema, records).map((r) =>
    buildRegistryMatch(
      'personalImport',
      {
        make: r.tozeret_nm,
        manufacturerRaw: r.tozeret_nm,
        model: r.degem_nm,
        year: r.shnat_yitzur,
        fuelRaw: r.sug_delek_nm,
        originRaw: r.sug_yevu,
        countryOfManufacture: r.tozeret_eretz_nm,
        vehicleTypeRaw: r.sug_rechev_nm,
      },
      {
        lastTestDate: isoDate(r.mivchan_acharon_dt),
        licenseValidUntil: isoDate(r.tokef_dt),
        onRoadSince: looseMonth(r.moed_aliya_lakvish),
        vin: r.shilda,
        engineModel: r.degem_manoa,
        grossWeightKg: r.mishkal_kolel || null,
      },
    ),
  );
}

const publicVehicleSchema = z.object({
  sug_rechev_nm: optString,
  shnat_yitzur: optNumber,
  mishkal_kolel: optNumber,
  tozeret_nm: optString,
  tzeva_rechev: optString,
  degem_nm: optString,
  kinuy_mishari: optString,
  tokef_dt: optString,
});

export function mapPublicVehicle(records: unknown[]): RegistryMatch[] {
  return parseRecords(publicVehicleSchema, records).map((r) =>
    buildRegistryMatch(
      'publicVehicles',
      {
        make: r.tozeret_nm,
        manufacturerRaw: r.tozeret_nm,
        model: r.degem_nm,
        commercialName: r.kinuy_mishari,
        year: r.shnat_yitzur,
        colorRaw: r.tzeva_rechev,
        vehicleTypeRaw: r.sug_rechev_nm,
      },
      {
        licenseValidUntil: isoDate(r.tokef_dt),
        grossWeightKg: r.mishkal_kolel || null,
      },
    ),
  );
}
