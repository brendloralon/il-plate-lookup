import { describe, expect, it } from 'vitest';
import { DATASETS, JOIN_DATASETS } from '../src/config/datasets';
import {
  compactDate,
  compactMonth,
  isoDate,
  looseMonth,
  mapFuel,
  mapOwnershipType,
} from '../src/mappers/common';
import { mapDisabledPermit } from '../src/mappers/disabledPermit';
import {
  mapHeavy,
  mapMotorcycle,
  mapPersonalImport,
  mapPublicVehicle,
} from '../src/mappers/fallbacks';
import { mapHistory } from '../src/mappers/history';
import { mapOffRoad } from '../src/mappers/offRoad';
import { mapOwnership } from '../src/mappers/ownership';
import { enrichRecalls, mapOpenRecalls, mapRecallNotices } from '../src/mappers/recalls';
import { mapRegistry } from '../src/mappers/registry';
import { mapSpecs } from '../src/mappers/specs';
import { loadFixture, recordsFor } from './helpers';

const skoda = loadFixture('36181801');
const mitsubishi = loadFixture('1000822');
const corolla = loadFixture('8959871');

describe('common helpers', () => {
  it('normalizes dates', () => {
    expect(isoDate('2026-06-16')).toBe('2026-06-16');
    expect(isoDate('2026-06-16T00:00:00')).toBe('2026-06-16');
    expect(isoDate('garbage')).toBeNull();
    expect(compactDate(20230419)).toBe('2023-04-19');
    expect(compactMonth(201712)).toBe('2017-12');
    expect(compactMonth(2017)).toBeNull();
    expect(looseMonth('2010-6')).toBe('2010-06');
    expect(looseMonth('2017-12')).toBe('2017-12');
    expect(looseMonth('2010')).toBe('2010');
    expect(looseMonth('')).toBeNull();
  });

  it('maps fuel types', () => {
    expect(mapFuel('בנזין')).toBe('petrol');
    expect(mapFuel('דיזל')).toBe('diesel');
    expect(mapFuel('חשמל')).toBe('electric');
    expect(mapFuel('חשמל/בנזין')).toBe('hybrid');
    expect(mapFuel('גפ"מ')).toBe('lpg');
    expect(mapFuel('מימן')).toBe('other');
    expect(mapFuel(null)).toBeNull();
  });

  it('maps ownership types', () => {
    expect(mapOwnershipType('פרטי')).toBe('private');
    expect(mapOwnershipType('חברה')).toBe('company');
    expect(mapOwnershipType('ליסינג')).toBe('leasing');
    expect(mapOwnershipType('השכרה')).toBe('rental');
    expect(mapOwnershipType('סוחר')).toBe('dealer');
    expect(mapOwnershipType('החכר')).toBe('hireLease');
    expect(mapOwnershipType('משהו')).toBe('other');
    expect(mapOwnershipType(null)).toBeNull();
  });
});

describe('mapRegistry', () => {
  it('maps a real registry record', () => {
    const [match] = mapRegistry(recordsFor(skoda, DATASETS.registry.resourceId), 'registry');
    expect(match?.summary).toMatchObject({
      manufacturerRaw: "סקודה צ'כיה",
      model: '5E36UD',
      commercialName: 'OCTAVIA',
      trim: 'RS',
      year: 2017,
      colorRaw: 'אדום',
      fuel: 'petrol',
      fuelRaw: 'בנזין',
    });
    expect(match?.registry).toMatchObject({
      kind: 'registry',
      onRoadSince: '2017-12',
      currentOwnership: 'private',
      vin: 'TMBAU7NE8J0197491',
      modelKey: { manufacturerCode: 676, modelCode: 733, modelType: 'P', year: 2017 },
    });
    expect(match?.registry.lastTestDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(match?.registry.licenseValidUntil).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('maps the inactive dataset with the same schema', () => {
    const [match] = mapRegistry(recordsFor(mitsubishi, DATASETS.inactive.resourceId), 'inactive');
    expect(match?.registry.kind).toBe('inactive');
    expect(match?.summary.manufacturerRaw).toBe('מיצובישי יפן');
    expect(match?.registry.modelKey).toMatchObject({ manufacturerCode: 590, modelType: 'M' });
  });

  it('turns blanks into nulls and omits the model key without a model code', () => {
    const [match] = mapRegistry(
      [
        {
          mispar_rechev: 1,
          tozeret_cd: 1,
          degem_cd: null,
          sug_degem: 'P',
          shnat_yitzur: 2000,
          tzeva_rechev: '  ',
        },
      ],
      'registry',
    );
    expect(match?.summary.colorRaw).toBeNull();
    expect(match?.registry.modelKey).toBeNull();
  });

  it('rejects records with impossible types', () => {
    expect(() => mapRegistry([{ shnat_yitzur: { nested: true } }], 'registry')).toThrow();
  });
});

describe('fallback mappers', () => {
  it('maps motorcycles', () => {
    const [match] = mapMotorcycle([
      {
        mispar_rechev: 35462701,
        tozeret_nm: 'ימאהה צרפת',
        tozeret_eretz_nm: 'צרפת',
        degem_nm: 'SEE6',
        shnat_yitzur: 2018,
        sug_delek_nm: 'בנזין',
        mishkal_kolel: 0,
        mida_zmig_kidmi: '120/70-15',
        moed_aliya_lakvish: '2018-10',
        sug_rechev_nm: 'אופנוע',
        baalut: 'פרטי',
        mkoriut_nm: '',
      },
    ]);
    expect(match?.registry).toMatchObject({
      kind: 'motorcycle',
      onRoadSince: '2018-10',
      frontTire: '120/70-15',
      grossWeightKg: null,
      currentOwnership: 'private',
    });
    expect(match?.summary).toMatchObject({
      vehicleTypeRaw: 'אופנוע',
      originRaw: null,
      fuel: 'petrol',
    });
  });

  it('maps heavy and inactive-without-model records', () => {
    const record = {
      mispar_rechev: 870,
      mispar_shilda: '006759',
      shnat_yitzur: 1955,
      tozeret_nm: 'שברולט ארהב"',
      sug_delek_nm: 'בנזין',
      mishkal_kolel: 2300,
      degem_nm: '3104',
      moed_aliya_lakvish: '',
      kvutzat_sug_rechev: 'מסחרי',
    };
    expect(mapHeavy([record], 'heavy')[0]?.registry).toMatchObject({
      kind: 'heavy',
      vin: '006759',
      grossWeightKg: 2300,
      onRoadSince: null,
    });
    expect(mapHeavy([record], 'inactiveNoModel')[0]?.registry.kind).toBe('inactiveNoModel');
  });

  it('maps personal imports with the import type as origin', () => {
    const [match] = mapPersonalImport([
      {
        mispar_rechev: 90486601,
        shilda: 'WDD2054421F480790',
        tozeret_nm: 'מרצדס בנץ גרמנ',
        degem_nm: 'C200',
        shnat_yitzur: 2017,
        mivchan_acharon_dt: '2026-10-28',
        tokef_dt: '2027-09-30',
        sug_yevu: 'יבוא אישי-משומש',
        moed_aliya_lakvish: '2017-9',
        sug_delek_nm: 'בנזין',
      },
    ]);
    expect(match?.summary.originRaw).toBe('יבוא אישי-משומש');
    expect(match?.registry).toMatchObject({
      licenseValidUntil: '2027-09-30',
      onRoadSince: '2017-09',
    });
  });

  it('maps public vehicles', () => {
    const [match] = mapPublicVehicle([
      {
        mispar_rechev: 17788803,
        sug_rechev_nm: 'אוטובוס',
        shnat_yitzur: 2022,
        tokef_dt: '2027-10-31',
      },
    ]);
    expect(match?.registry).toMatchObject({
      kind: 'publicVehicles',
      licenseValidUntil: '2027-10-31',
    });
  });
});

describe('mapHistory', () => {
  it('maps a real history record with indicator flags', () => {
    expect(mapHistory(recordsFor(skoda, DATASETS.history.resourceId))).toEqual([
      expect.objectContaining({
        firstRegistrationDate: '2017-12-05',
        originRaw: null,
        structuralChange: true,
        lpgConversion: false,
        colorChanged: true,
        tireSizeChanged: false,
      }),
    ]);
  });
});

describe('mapOwnership', () => {
  it('maps real ownership rows oldest-first', () => {
    const rows = mapOwnership(recordsFor(skoda, DATASETS.ownership.resourceId));
    expect(rows.length).toBeGreaterThanOrEqual(9);
    expect(rows[0]).toEqual({ since: '2017-12', type: 'company', typeRaw: 'חברה' });
    const sorted = [...rows].sort((a, b) => a.since.localeCompare(b.since));
    expect(rows.map((r) => r.since)).toEqual(sorted.map((r) => r.since));
    expect(rows.some((r) => r.type === 'dealer')).toBe(true);
  });

  it('sorts unordered rows and drops invalid ones', () => {
    expect(
      mapOwnership([
        { _id: 2, baalut_dt: 202001, baalut: 'פרטי' },
        { _id: 1, baalut_dt: 201805, baalut: 'ליסינג' },
        { _id: 3, baalut_dt: null, baalut: 'פרטי' },
        { _id: 4, baalut_dt: 202101, baalut: '' },
      ]),
    ).toEqual([
      { since: '2018-05', type: 'leasing', typeRaw: 'ליסינג' },
      { since: '2020-01', type: 'private', typeRaw: 'פרטי' },
    ]);
  });
});

describe('recall mappers', () => {
  it('maps real open recalls newest first', () => {
    const recalls = mapOpenRecalls(recordsFor(mitsubishi, DATASETS.recalls.resourceId));
    expect(recalls.map((r) => r.id)).toEqual([12120, 11445]);
    expect(recalls[0]).toMatchObject({
      safety: true,
      categoryRaw: 'כריות אוויר',
      openedDate: '2017-11-27',
      importer: null,
    });
  });

  it('enriches recalls with manufacturer notices', () => {
    const recalls = mapOpenRecalls(recordsFor(mitsubishi, DATASETS.recalls.resourceId));
    const notices = mapRecallNotices(
      recordsFor(mitsubishi, JOIN_DATASETS.recallNotices.resourceId),
    );
    expect([...notices.keys()].sort()).toEqual([11445, 12120]);
    const enriched = enrichRecalls(recalls, notices);
    expect(enriched.every((r) => r.importer !== null)).toBe(true);
    expect(enriched[0]?.categoryRaw).toBe('כריות אוויר');
  });

  it('marks technical service campaigns as non-safety', () => {
    const [recall] = mapOpenRecalls([
      {
        MISPAR_RECHEV: 1,
        RECALL_ID: 5,
        SUG_RECALL: 'קמפיין שרות טכני',
        TAARICH_PTICHA: '2020-01-01',
      },
    ]);
    expect(recall?.safety).toBe(false);
  });
});

describe('mapOffRoad', () => {
  it('maps the current resource', () => {
    expect(mapOffRoad(recordsFor(corolla, DATASETS.offRoad.resourceId))).toEqual([
      { cancelledOn: '2026-10-29', vehicleTypeRaw: 'פרטי נוסעים' },
    ]);
  });

  it('maps the legacy text-only resources', () => {
    expect(
      mapOffRoad([
        { mispar_rechev: '03602428', bitul_dt: '2015-02-01', sug_rechev_nm: 'מרכב אחוד' },
      ]),
    ).toEqual([{ cancelledOn: '2015-02-01', vehicleTypeRaw: 'מרכב אחוד' }]);
  });
});

describe('mapDisabledPermit', () => {
  it('maps the space-named columns and compact dates', () => {
    expect(
      mapDisabledPermit([
        { 'MISPAR RECHEV': 50096, 'TAARICH HAFAKAT TAG': 20230419, 'SUG TAV': 1 },
      ]),
    ).toEqual([{ issuedOn: '2023-04-19', permitType: 1 }]);
  });
});

describe('mapSpecs', () => {
  it('maps a real WLTP record', () => {
    const [match] = mapSpecs(recordsFor(skoda, JOIN_DATASETS.wltpSpecs.resourceId));
    expect(match?.make).toBe('סקודה');
    expect(match?.country).toBeTruthy();
    expect(match?.specs.engineCc).toBeGreaterThan(1000);
    expect(match?.specs.horsepower).toBeGreaterThan(100);
    expect(typeof match?.specs.abs).toBe('boolean');
  });

  it('treats zero engine/power as unknown and the unknown drive code as null', () => {
    const [match] = mapSpecs([
      { nefah_manoa: 0, koah_sus: 0, hanaa_nm: 'לא ידוע קוד', abs_ind: 0 },
    ]);
    expect(match?.specs).toMatchObject({
      engineCc: null,
      horsepower: null,
      driveRaw: null,
      abs: false,
    });
  });
});
