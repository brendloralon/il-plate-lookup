/**
 * data.gov.il CKAN resource IDs and lookup fields.
 * Verified 2026-11-05. See docs/data-sources.md for field maps and sample records.
 */
import type { SourceId } from '@app/shared';

export const CKAN_BASE_URL = 'https://data.gov.il/api/3/action/';

export type PlateFieldFormat = 'number' | 'padded8';

export interface DatasetDef {
  readonly id: SourceId;
  readonly resourceId: string;
  readonly label: string;
}

export interface PlateDatasetDef extends DatasetDef {
  /** Exact field name used in `filters` (casing and spaces differ between datasets). */
  readonly plateField: string;
  /** Legacy resources store plates as zero-padded 8-character text. */
  readonly plateFormat: PlateFieldFormat;
  readonly limit: number;
}

const plateDataset = (
  id: SourceId,
  resourceId: string,
  label: string,
  plateField = 'mispar_rechev',
  plateFormat: PlateFieldFormat = 'number',
  limit = 5,
): PlateDatasetDef => ({ id, resourceId, label, plateField, plateFormat, limit });

export const DATASETS = {
  registry: plateDataset(
    'registry',
    '053cea08-09bc-40ec-8f7a-156f0677aff3',
    'מספרי רישוי של כלי רכב פרטיים ומסחריים',
  ),
  inactive: plateDataset(
    'inactive',
    'f6efe89a-fb3d-43a4-bb61-9bf12a9b9099',
    'כלי רכב לא פעילים עם קוד דגם',
  ),
  personalImport: plateDataset(
    'personalImport',
    '03adc637-b6fe-402b-9937-7c3d3afc9140',
    'כלי רכב ביבוא אישי',
  ),
  motorcycle: plateDataset(
    'motorcycle',
    'bf9df4e2-d90d-4c0a-a400-19e15af8e95f',
    'מספרי רישוי של כלי רכב דו גלגליים',
  ),
  heavy: plateDataset(
    'heavy',
    'cd3acc5c-03c3-4c89-9c54-d40f93c0d790',
    'כלי רכב מעל 3.5 טון וחסרי קוד דגם',
  ),
  publicVehicles: plateDataset(
    'publicVehicles',
    'cf29862d-ca25-4691-84f6-1be60dcb4a1e',
    'כלי רכב ציבוריים פעילים',
  ),
  inactiveNoModel: plateDataset(
    'inactiveNoModel',
    '6f6acd03-f351-4a8f-8ecf-df792f4f573a',
    'כלי רכב לא פעילים וחסרי קוד דגם',
  ),
  history: plateDataset(
    'history',
    '56063a99-8a3e-4ff4-912e-5966c0279bad',
    'היסטוריית כלי רכב פרטיים',
  ),
  ownership: plateDataset(
    'ownership',
    'bb2355dc-9ec7-4f06-9c3f-3344672171da',
    'היסטוריית בעלויות',
    'mispar_rechev',
    'number',
    100,
  ),
  recalls: plateDataset(
    'recalls',
    '36bf1404-0be4-49d2-82dc-2f1ead4a8b93',
    'כלי רכב שלא ביצעו ריקול',
    'MISPAR_RECHEV',
    'number',
    100,
  ),
  offRoad: plateDataset(
    'offRoad',
    '851ecab1-0622-4dbe-a6c7-f950cf82abf9',
    'כלי רכב שירדו מהכביש (ביטול סופי)',
  ),
  offRoad2010to2016: plateDataset(
    'offRoad2010to2016',
    '4e6b9724-4c1e-43f0-909a-154d4cc4e046',
    'כלי רכב שירדו מהכביש 2010-2016',
    'mispar_rechev',
    'padded8',
  ),
  offRoad2000to2009: plateDataset(
    'offRoad2000to2009',
    'ec8cbc34-72e1-4b69-9c48-22821ba0bd6c',
    'כלי רכב שירדו מהכביש 2000-2009',
    'mispar_rechev',
    'padded8',
  ),
  disabledPermit: plateDataset(
    'disabledPermit',
    'c8b9f9c8-4612-4068-934f-d4acd2e3c06e',
    'כלי רכב עם תג חניה לנכה',
    'MISPAR RECHEV',
  ),
} as const satisfies Record<string, PlateDatasetDef>;

/** Joined by keys other than the plate. */
export const JOIN_DATASETS = {
  /** Join on tozeret_cd + degem_cd + shnat_yitzur + sug_degem from the registry. */
  wltpSpecs: {
    id: 'wltpSpecs',
    resourceId: '142afde2-6228-49f9-8a29-9b6c3a0cbe40',
    label: 'תוצרים ודגמים של כלי רכב (WLTP)',
  },
  /** Join on RECALL_ID from the open-recalls dataset. */
  recallNotices: {
    id: 'recallNotices',
    resourceId: '2c33523f-87aa-44ec-a736-edbb0a82975e',
    label: 'הודעות יצרני הרכב RECALL',
  },
} as const satisfies Record<string, DatasetDef>;

/** Listed in `sources[]` with status "unavailable": no public dataset exists. */
export const UNAVAILABLE_SOURCES = [{ id: 'stolen', label: 'רכבים גנובים' }] as const;

/** Registry-like datasets in fallback priority order. */
export const REGISTRY_PRIORITY = [
  'registry',
  'inactive',
  'personalImport',
  'motorcycle',
  'heavy',
  'publicVehicles',
  'inactiveNoModel',
] as const satisfies readonly (keyof typeof DATASETS)[];
