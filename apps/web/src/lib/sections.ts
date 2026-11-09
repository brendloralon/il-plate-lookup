import type { SourceId, VehicleReport } from '@app/shared';
import type { SectionState } from '../components/ui';

export const REGISTRY_SOURCES: SourceId[] = [
  'registry',
  'inactive',
  'personalImport',
  'motorcycle',
  'heavy',
  'publicVehicles',
  'inactiveNoModel',
];

/**
 * Loading while the report is in flight; ready when the section has data;
 * otherwise error if any of its sources failed upstream, else empty.
 */
export function sectionState(
  report: VehicleReport | null,
  hasData: boolean,
  sourceIds: SourceId[],
): SectionState {
  if (!report) return 'loading';
  if (hasData) return 'ready';
  const failed = report.sources.some((s) => sourceIds.includes(s.id) && s.status === 'error');
  return failed ? 'error' : 'empty';
}
