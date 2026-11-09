import { z } from 'zod';

/**
 * The normalized vehicle report returned by `GET /api/vehicle/:plate`.
 * Keys are English; free-text values (color, trim, defect descriptions) stay in Hebrew as published.
 * Dates are ISO `YYYY-MM-DD`, or `YYYY-MM` where the source only has month precision.
 */

export const sourceStatusSchema = z.enum(['ok', 'empty', 'error', 'unavailable']);
export type SourceStatus = z.infer<typeof sourceStatusSchema>;

export const sourceIdSchema = z.enum([
  'registry',
  'inactive',
  'personalImport',
  'motorcycle',
  'heavy',
  'publicVehicles',
  'inactiveNoModel',
  'history',
  'ownership',
  'recalls',
  'recallNotices',
  'offRoad',
  'offRoad2010to2016',
  'offRoad2000to2009',
  'disabledPermit',
  'wltpSpecs',
  'stolen',
]);
export type SourceId = z.infer<typeof sourceIdSchema>;

export const sourceInfoSchema = z.object({
  id: sourceIdSchema,
  name: z.string(),
  resourceId: z.string().nullable(),
  status: sourceStatusSchema,
});
export type SourceInfo = z.infer<typeof sourceInfoSchema>;

/** Which registry dataset the vehicle's base record came from. */
export const registryKindSchema = z.enum([
  'registry',
  'inactive',
  'personalImport',
  'motorcycle',
  'heavy',
  'publicVehicles',
  'inactiveNoModel',
]);
export type RegistryKind = z.infer<typeof registryKindSchema>;

export const fuelTypeSchema = z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'lpg', 'other']);
export type FuelType = z.infer<typeof fuelTypeSchema>;

export const ownershipTypeSchema = z.enum([
  'private',
  'company',
  'leasing',
  'rental',
  'dealer',
  'hireLease',
  'other',
]);
export type OwnershipType = z.infer<typeof ownershipTypeSchema>;

export const summarySchema = z.object({
  make: z.string().nullable(),
  /** Manufacturer as published, usually "<make> <country>", e.g. "טויוטה יפן". */
  manufacturerRaw: z.string().nullable(),
  model: z.string().nullable(),
  commercialName: z.string().nullable(),
  trim: z.string().nullable(),
  year: z.number().int().nullable(),
  colorRaw: z.string().nullable(),
  fuel: fuelTypeSchema.nullable(),
  fuelRaw: z.string().nullable(),
  /** e.g. "יבוא אישי-משומש"; null when regular import or unknown. */
  originRaw: z.string().nullable(),
  countryOfManufacture: z.string().nullable(),
  vehicleTypeRaw: z.string().nullable(),
});
export type Summary = z.infer<typeof summarySchema>;

export const registrySchema = z.object({
  kind: registryKindSchema,
  lastTestDate: z.string().nullable(),
  licenseValidUntil: z.string().nullable(),
  onRoadSince: z.string().nullable(),
  currentOwnership: ownershipTypeSchema.nullable(),
  currentOwnershipRaw: z.string().nullable(),
  vin: z.string().nullable(),
  engineModel: z.string().nullable(),
  pollutionGroup: z.number().nullable(),
  safetyEquipmentLevel: z.number().nullable(),
  frontTire: z.string().nullable(),
  rearTire: z.string().nullable(),
  grossWeightKg: z.number().nullable(),
  /** WLTP join keys, present only for datasets that carry a model code. */
  modelKey: z
    .object({
      manufacturerCode: z.number(),
      modelCode: z.number(),
      modelType: z.string(),
      year: z.number(),
    })
    .nullable(),
});
export type Registry = z.infer<typeof registrySchema>;

export const historySchema = z.object({
  mileageAtLastTest: z.number().nullable(),
  firstRegistrationDate: z.string().nullable(),
  originRaw: z.string().nullable(),
  engineNumber: z.string().nullable(),
  structuralChange: z.boolean().nullable(),
  lpgConversion: z.boolean().nullable(),
  colorChanged: z.boolean().nullable(),
  tireSizeChanged: z.boolean().nullable(),
});
export type History = z.infer<typeof historySchema>;

export const ownershipEntrySchema = z.object({
  /** `YYYY-MM` */
  since: z.string(),
  type: ownershipTypeSchema,
  typeRaw: z.string(),
});
export type OwnershipEntry = z.infer<typeof ownershipEntrySchema>;

export const recallSchema = z.object({
  id: z.number(),
  kindRaw: z.string().nullable(),
  safety: z.boolean(),
  categoryRaw: z.string().nullable(),
  descriptionRaw: z.string().nullable(),
  openedDate: z.string().nullable(),
  fixMethodRaw: z.string().nullable(),
  importer: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
});
export type Recall = z.infer<typeof recallSchema>;

export const specsSchema = z.object({
  bodyTypeRaw: z.string().nullable(),
  engineCc: z.number().nullable(),
  horsepower: z.number().nullable(),
  automatic: z.boolean().nullable(),
  driveRaw: z.string().nullable(),
  propulsionRaw: z.string().nullable(),
  fuelRaw: z.string().nullable(),
  grossWeightKg: z.number().nullable(),
  doors: z.number().nullable(),
  seats: z.number().nullable(),
  towingBrakedKg: z.number().nullable(),
  towingUnbrakedKg: z.number().nullable(),
  airbags: z.number().nullable(),
  abs: z.boolean().nullable(),
  stabilityControl: z.boolean().nullable(),
  laneDepartureControl: z.boolean().nullable(),
  forwardDistanceMonitoring: z.boolean().nullable(),
  pedestrianDetection: z.boolean().nullable(),
  adaptiveCruise: z.boolean().nullable(),
  blindSpotDetection: z.boolean().nullable(),
  reverseCamera: z.boolean().nullable(),
  safetyEquipmentLevel: z.number().nullable(),
  safetyScore: z.number().nullable(),
  pollutionGroup: z.number().nullable(),
  greenIndex: z.number().nullable(),
  co2Wltp: z.number().nullable(),
  homologationRaw: z.string().nullable(),
});
export type Specs = z.infer<typeof specsSchema>;

export const flagsSchema = z.object({
  /** Always null: no public plate-level stolen-vehicle dataset exists. */
  stolen: z.boolean().nullable(),
  offRoad: z.boolean().nullable(),
  offRoadDate: z.string().nullable(),
  disabledPermit: z.boolean().nullable(),
  disabledPermitDate: z.string().nullable(),
});
export type Flags = z.infer<typeof flagsSchema>;

export const vehicleReportSchema = z.object({
  plate: z.string(),
  found: z.boolean(),
  summary: summarySchema.nullable(),
  registry: registrySchema.nullable(),
  history: historySchema.nullable(),
  ownership: z.array(ownershipEntrySchema).nullable(),
  recalls: z.array(recallSchema).nullable(),
  flags: flagsSchema,
  specs: specsSchema.nullable(),
  sources: z.array(sourceInfoSchema),
  fetchedAt: z.string(),
});
export type VehicleReport = z.infer<typeof vehicleReportSchema>;

export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
