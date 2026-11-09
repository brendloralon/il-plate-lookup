import { daysUntil } from './dates';
import type { VehicleReport } from './dto';

export const MANY_OWNERSHIP_CHANGES = 4;

export type AlertKind = 'stolen' | 'offRoad' | 'openRecalls' | 'manyOwners' | 'licenseExpired';

export interface Alert {
  kind: AlertKind;
  /** Count or date that the UI interpolates into the message. */
  detail: string | number | null;
}

/** Ownership changes = ownership periods minus the first one (dealer periods count). */
export function ownershipChanges(report: Pick<VehicleReport, 'ownership'>): number {
  return Math.max(0, (report.ownership?.length ?? 0) - 1);
}

export function computeAlerts(
  report: Pick<VehicleReport, 'flags' | 'recalls' | 'ownership' | 'registry'>,
  today: Date,
): Alert[] {
  const alerts: Alert[] = [];

  if (report.flags.stolen === true) alerts.push({ kind: 'stolen', detail: null });

  if (report.flags.offRoad === true) {
    alerts.push({ kind: 'offRoad', detail: report.flags.offRoadDate });
  }

  const recallCount = report.recalls?.length ?? 0;
  if (recallCount > 0) alerts.push({ kind: 'openRecalls', detail: recallCount });

  const changes = ownershipChanges(report);
  if (changes >= MANY_OWNERSHIP_CHANGES) alerts.push({ kind: 'manyOwners', detail: changes });

  const validUntil = report.registry?.licenseValidUntil;
  if (validUntil) {
    const days = daysUntil(validUntil, today);
    if (days !== null && days < 0) alerts.push({ kind: 'licenseExpired', detail: validUntil });
  }

  return alerts;
}
