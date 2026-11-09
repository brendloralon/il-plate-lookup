import { describe, expect, it } from 'vitest';
import { computeAlerts, ownershipChanges } from './alerts';
import type { OwnershipEntry, Recall, Registry, VehicleReport } from './dto';

const today = new Date(2026, 10, 5);

type AlertInput = Pick<VehicleReport, 'flags' | 'recalls' | 'ownership' | 'registry'>;

function input(overrides: Partial<AlertInput> = {}): AlertInput {
  return {
    flags: {
      stolen: null,
      offRoad: false,
      offRoadDate: null,
      disabledPermit: false,
      disabledPermitDate: null,
    },
    recalls: [],
    ownership: [],
    registry: null,
    ...overrides,
  };
}

const owner = (since: string): OwnershipEntry => ({ since, type: 'private', typeRaw: 'פרטי' });

const recall: Recall = {
  id: 1,
  kindRaw: null,
  safety: true,
  categoryRaw: null,
  descriptionRaw: null,
  openedDate: null,
  fixMethodRaw: null,
  importer: null,
  phone: null,
  website: null,
};

const registry = (licenseValidUntil: string | null): Registry => ({
  kind: 'registry',
  lastTestDate: null,
  licenseValidUntil,
  onRoadSince: null,
  currentOwnership: null,
  currentOwnershipRaw: null,
  vin: null,
  engineModel: null,
  pollutionGroup: null,
  safetyEquipmentLevel: null,
  frontTire: null,
  rearTire: null,
  grossWeightKg: null,
  modelKey: null,
});

describe('computeAlerts', () => {
  it('returns nothing for a clean vehicle', () => {
    expect(computeAlerts(input({ registry: registry('2027-01-01') }), today)).toEqual([]);
  });

  it('does not raise stolen when the flag is unknown (null)', () => {
    expect(computeAlerts(input(), today).map((a) => a.kind)).not.toContain('stolen');
  });

  it('raises stolen when the flag is true', () => {
    const flags = { ...input().flags, stolen: true };
    expect(computeAlerts(input({ flags }), today)).toContainEqual({ kind: 'stolen', detail: null });
  });

  it('raises off-road with its date', () => {
    const flags = { ...input().flags, offRoad: true, offRoadDate: '2026-10-29' };
    expect(computeAlerts(input({ flags }), today)).toContainEqual({
      kind: 'offRoad',
      detail: '2026-10-29',
    });
  });

  it('raises open recalls with the count', () => {
    expect(computeAlerts(input({ recalls: [recall, recall] }), today)).toContainEqual({
      kind: 'openRecalls',
      detail: 2,
    });
  });

  it('raises many owners at 4 changes (5 periods), not at 3', () => {
    const four = ['2017-01', '2018-01', '2019-01', '2020-01'].map(owner);
    expect(computeAlerts(input({ ownership: four }), today).map((a) => a.kind)).not.toContain(
      'manyOwners',
    );
    const five = [...four, owner('2021-01')];
    expect(computeAlerts(input({ ownership: five }), today)).toContainEqual({
      kind: 'manyOwners',
      detail: 4,
    });
  });

  it('raises license expired only when the date is in the past', () => {
    expect(computeAlerts(input({ registry: registry('2026-11-04') }), today)).toContainEqual({
      kind: 'licenseExpired',
      detail: '2026-11-04',
    });
    expect(computeAlerts(input({ registry: registry('2026-11-05') }), today)).toEqual([]);
  });

  it('tolerates null sections', () => {
    expect(computeAlerts(input({ recalls: null, ownership: null, registry: null }), today)).toEqual(
      [],
    );
  });
});

describe('ownershipChanges', () => {
  it('is periods minus one, never negative', () => {
    expect(ownershipChanges({ ownership: null })).toBe(0);
    expect(ownershipChanges({ ownership: [] })).toBe(0);
    expect(ownershipChanges({ ownership: [owner('2017-01'), owner('2018-01')] })).toBe(1);
  });
});
