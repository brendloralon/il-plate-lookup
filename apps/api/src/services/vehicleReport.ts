import type {
  Flags,
  History,
  OwnershipEntry,
  Recall,
  SourceId,
  SourceInfo,
  Specs,
  VehicleReport,
} from '@app/shared';
import { padPlate8 } from '@app/shared';
import type { CkanClient } from '../ckan/client';
import {
  DATASETS,
  JOIN_DATASETS,
  REGISTRY_PRIORITY,
  UNAVAILABLE_SOURCES,
  type DatasetDef,
  type PlateDatasetDef,
} from '../config/datasets';
import { mapDisabledPermit } from '../mappers/disabledPermit';
import { mapHeavy, mapMotorcycle, mapPersonalImport, mapPublicVehicle } from '../mappers/fallbacks';
import { mapHistory } from '../mappers/history';
import { mapOffRoad } from '../mappers/offRoad';
import { mapOwnership } from '../mappers/ownership';
import { enrichRecalls, mapOpenRecalls, mapRecallNotices } from '../mappers/recalls';
import { mapRegistry, type RegistryMatch } from '../mappers/registry';
import { mapSpecs, type SpecsMatch } from '../mappers/specs';

type Status = 'ok' | 'empty' | 'error';

interface Outcome<T> {
  status: Status;
  /** Mapped rows; empty when status is "empty", null when "error". */
  rows: T[] | null;
}

type DatasetKey = keyof typeof DATASETS;

const MAPPERS = {
  registry: (r) => mapRegistry(r, 'registry'),
  inactive: (r) => mapRegistry(r, 'inactive'),
  personalImport: mapPersonalImport,
  motorcycle: mapMotorcycle,
  heavy: (r) => mapHeavy(r, 'heavy'),
  publicVehicles: mapPublicVehicle,
  inactiveNoModel: (r) => mapHeavy(r, 'inactiveNoModel'),
  history: mapHistory,
  ownership: mapOwnership,
  recalls: mapOpenRecalls,
  offRoad: mapOffRoad,
  offRoad2010to2016: mapOffRoad,
  offRoad2000to2009: mapOffRoad,
  disabledPermit: mapDisabledPermit,
} satisfies Record<DatasetKey, (records: unknown[]) => unknown[]>;

type Mapped<K extends DatasetKey> = ReturnType<(typeof MAPPERS)[K]>[number];
type PlateOutcomes = { [K in DatasetKey]: Outcome<Mapped<K>> };

export interface VehicleReportServiceOptions {
  client: CkanClient;
  onDatasetError?: (source: SourceId, error: unknown) => void;
  now?: () => Date;
}

export interface VehicleReportService {
  getReport(plate: string): Promise<VehicleReport>;
}

function settle<T>(result: PromiseSettledResult<T[]>): Outcome<T> {
  if (result.status === 'rejected') return { status: 'error', rows: null };
  return { status: result.value.length > 0 ? 'ok' : 'empty', rows: result.value };
}

function plateFilterValue(def: PlateDatasetDef, plate: string): string | number {
  return def.plateFormat === 'padded8' ? padPlate8(plate) : Number(plate);
}

const source = (def: DatasetDef, status: SourceInfo['status']): SourceInfo => ({
  id: def.id,
  name: def.label,
  resourceId: def.resourceId,
  status,
});

/** true/false when every queried resource answered; null when the answer is unknown. */
function presence<T>(outcomes: Outcome<T>[]): { value: boolean | null; first: T | null } {
  const hit = outcomes.find((o) => o.status === 'ok');
  if (hit?.rows?.[0] !== undefined) return { value: true, first: hit.rows[0] };
  if (outcomes.some((o) => o.status === 'error')) return { value: null, first: null };
  return { value: false, first: null };
}

export function createVehicleReportService({
  client,
  onDatasetError,
  now = () => new Date(),
}: VehicleReportServiceOptions): VehicleReportService {
  async function run<T>(id: SourceId, task: () => Promise<T[]>): Promise<T[]> {
    try {
      return await task();
    } catch (err) {
      onDatasetError?.(id, err);
      throw err;
    }
  }

  async function queryPlate<K extends DatasetKey>(key: K, plate: string): Promise<Mapped<K>[]> {
    const def: PlateDatasetDef = DATASETS[key];
    return run(def.id, async () => {
      const records = await client.search(
        def.resourceId,
        { [def.plateField]: plateFilterValue(def, plate) },
        { limit: def.limit },
      );
      const mapper: (records: unknown[]) => Mapped<K>[] = MAPPERS[key];
      return mapper(records);
    });
  }

  async function querySpecs(match: RegistryMatch | null): Promise<Outcome<SpecsMatch> | null> {
    const key = match?.registry.modelKey;
    if (!key) return null;
    const [result] = await Promise.allSettled([
      run('wltpSpecs', async () =>
        mapSpecs(
          await client.search(
            JOIN_DATASETS.wltpSpecs.resourceId,
            {
              tozeret_cd: key.manufacturerCode,
              degem_cd: key.modelCode,
              shnat_yitzur: key.year,
              sug_degem: key.modelType,
            },
            { limit: 1 },
          ),
        ),
      ),
    ]);
    return settle(result);
  }

  async function queryRecallNotices(recalls: Recall[] | null) {
    const ids = [...new Set((recalls ?? []).map((r) => r.id))];
    if (ids.length === 0) return null;
    const [result] = await Promise.allSettled([
      run('recallNotices', async () => [
        mapRecallNotices(
          await client.search(
            JOIN_DATASETS.recallNotices.resourceId,
            { RECALL_ID: ids },
            { limit: 100 },
          ),
        ),
      ]),
    ]);
    if (result.status === 'rejected') return { status: 'error' as const, notices: null };
    const notices = result.value[0] ?? new Map();
    return { status: notices.size > 0 ? ('ok' as const) : ('empty' as const), notices };
  }

  return {
    async getReport(plate) {
      // Phase 1: every plate-keyed dataset in parallel.
      const keys = Object.keys(DATASETS) as DatasetKey[];
      const settled = await Promise.allSettled(keys.map((key) => queryPlate(key, plate)));
      const outcomes = Object.fromEntries(
        keys.map((key, i) => [key, settle(settled[i] as PromiseSettledResult<unknown[]>)]),
      ) as PlateOutcomes;

      const registryHit = REGISTRY_PRIORITY.map((key) => outcomes[key]).find(
        (o) => o.status === 'ok',
      );
      const match: RegistryMatch | null = registryHit?.rows?.[0] ?? null;

      const history: History | null = outcomes.history.rows?.[0] ?? null;
      const ownership: OwnershipEntry[] | null = outcomes.ownership.rows;
      const openRecalls: Recall[] | null = outcomes.recalls.rows;

      // Phase 2: joins that depend on phase-1 results.
      const [specsOutcome, noticesOutcome] = await Promise.all([
        querySpecs(match),
        queryRecallNotices(openRecalls),
      ]);

      const specsMatch = specsOutcome?.rows?.[0] ?? null;
      const specs: Specs | null = specsMatch?.specs ?? null;
      const recalls =
        openRecalls && noticesOutcome?.notices
          ? enrichRecalls(openRecalls, noticesOutcome.notices)
          : openRecalls;

      const summary = match
        ? {
            ...match.summary,
            make: specsMatch?.make ?? match.summary.make,
            countryOfManufacture: match.summary.countryOfManufacture ?? specsMatch?.country ?? null,
            originRaw: match.summary.originRaw ?? history?.originRaw ?? null,
          }
        : null;

      const offRoad = presence([
        outcomes.offRoad,
        outcomes.offRoad2010to2016,
        outcomes.offRoad2000to2009,
      ]);
      const disabled = presence([outcomes.disabledPermit]);
      const flags: Flags = {
        stolen: null,
        offRoad: offRoad.value,
        offRoadDate: offRoad.first?.cancelledOn ?? null,
        disabledPermit: disabled.value,
        disabledPermitDate: disabled.first?.issuedOn ?? null,
      };

      const sources: SourceInfo[] = [
        ...keys.map((key) => source(DATASETS[key], outcomes[key].status)),
        source(JOIN_DATASETS.wltpSpecs, specsOutcome?.status ?? 'empty'),
        source(JOIN_DATASETS.recallNotices, noticesOutcome?.status ?? 'empty'),
        ...UNAVAILABLE_SOURCES.map((s): SourceInfo => ({
          id: s.id,
          name: s.label,
          resourceId: null,
          status: 'unavailable',
        })),
      ];

      const found = keys.some((key) => outcomes[key].status === 'ok');

      return {
        plate,
        found,
        summary,
        registry: match?.registry ?? null,
        history,
        ownership,
        recalls,
        flags,
        specs,
        sources,
        fetchedAt: now().toISOString(),
      };
    },
  };
}
