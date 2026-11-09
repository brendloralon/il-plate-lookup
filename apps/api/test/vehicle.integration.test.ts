import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { vehicleReportSchema, type VehicleReport } from '@app/shared';
import { buildApp } from '../src/app';
import { createCkanClient } from '../src/ckan/client';
import { CKAN_BASE_URL, DATASETS } from '../src/config/datasets';
import { ckanHandler, FIXTURE_PLATES, loadFixture, type UpstreamOverride } from './helpers';

const fixtures = FIXTURE_PLATES.map(loadFixture);
const server = setupServer(ckanHandler(fixtures));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const NOW = new Date('2026-11-05T12:00:00Z');

async function app(rateLimit = { max: 1_000, timeWindowMs: 60_000 }) {
  // Fresh client per test so the LRU cache doesn't leak between tests.
  const client = createCkanClient({ baseUrl: CKAN_BASE_URL, retryDelayMs: 0 });
  return buildApp({ client, rateLimit, now: () => NOW });
}

async function getReport(plate: string, overrides: UpstreamOverride[] = []) {
  if (overrides.length > 0) server.use(ckanHandler(fixtures, overrides));
  const instance = await app();
  const response = await instance.inject({ method: 'GET', url: `/api/vehicle/${plate}` });
  await instance.close();
  return response;
}

const statusOf = (report: VehicleReport, id: string) =>
  report.sources.find((s) => s.id === id)?.status;

describe('GET /api/vehicle/:plate', () => {
  it('aggregates every dataset into one validated DTO', async () => {
    const response = await getReport('361-81-801');
    expect(response.statusCode).toBe(200);
    const report = vehicleReportSchema.parse(response.json());

    expect(report.plate).toBe('36181801');
    expect(report.found).toBe(true);
    expect(report.fetchedAt).toBe(NOW.toISOString());
    expect(report.summary).toMatchObject({
      make: 'סקודה',
      commercialName: 'OCTAVIA',
      trim: 'RS',
      year: 2017,
      colorRaw: 'אדום',
    });
    expect(report.registry?.kind).toBe('registry');
    expect(report.history?.mileageAtLastTest).toBeGreaterThan(0);
    expect(report.ownership?.length).toBeGreaterThanOrEqual(9);
    expect(report.recalls).toEqual([]);
    expect(report.specs?.horsepower).toBeGreaterThan(100);
    expect(report.flags).toEqual({
      stolen: null,
      offRoad: false,
      offRoadDate: null,
      disabledPermit: false,
      disabledPermitDate: null,
    });
    expect(statusOf(report, 'registry')).toBe('ok');
    expect(statusOf(report, 'motorcycle')).toBe('empty');
    expect(statusOf(report, 'wltpSpecs')).toBe('ok');
    expect(statusOf(report, 'stolen')).toBe('unavailable');
    expect(report.sources.find((s) => s.id === 'stolen')?.resourceId).toBeNull();
  });

  it('falls back to the inactive registry and joins recall notices', async () => {
    const report = vehicleReportSchema.parse((await getReport('1000822')).json());
    expect(report.registry?.kind).toBe('inactive');
    expect(report.summary?.make).toBe('מיצובישי');
    expect(report.recalls?.map((r) => r.id)).toEqual([12120, 11445]);
    expect(report.recalls?.every((r) => r.importer !== null)).toBe(true);
    expect(statusOf(report, 'recallNotices')).toBe('ok');
    expect(report.specs).not.toBeNull();
  });

  it('flags vehicles removed from the road', async () => {
    const report = vehicleReportSchema.parse((await getReport('8959871')).json());
    expect(report.found).toBe(true);
    expect(report.flags.offRoad).toBe(true);
    expect(report.flags.offRoadDate).toBe('2026-10-29');
    expect(report.summary).toBeNull();
    expect(statusOf(report, 'wltpSpecs')).toBe('empty');
  });

  it('returns found=false for an unknown plate', async () => {
    const report = vehicleReportSchema.parse((await getReport('99999999')).json());
    expect(report.found).toBe(false);
    expect(report.summary).toBeNull();
    expect(report.ownership).toEqual([]);
    expect(report.sources.filter((s) => s.status === 'ok')).toEqual([]);
  });

  it('isolates a failing dataset: null section, error status, rest intact', async () => {
    const report = vehicleReportSchema.parse(
      (
        await getReport('36181801', [
          {
            resourceId: DATASETS.ownership.resourceId,
            respond: () => new HttpResponse('upstream down', { status: 503 }),
          },
          {
            resourceId: DATASETS.offRoad.resourceId,
            respond: () => HttpResponse.json({ success: true, result: { nope: 1 } }),
          },
        ])
      ).json(),
    );
    expect(report.ownership).toBeNull();
    expect(statusOf(report, 'ownership')).toBe('error');
    expect(statusOf(report, 'offRoad')).toBe('error');
    expect(report.flags.offRoad).toBeNull();
    expect(report.summary?.commercialName).toBe('OCTAVIA');
    expect(report.history).not.toBeNull();
  });

  it('marks a dataset as error when its records fail validation', async () => {
    const report = vehicleReportSchema.parse(
      (
        await getReport('36181801', [
          {
            resourceId: DATASETS.history.resourceId,
            respond: () =>
              HttpResponse.json({
                success: true,
                result: { records: [{ kilometer_test_aharon: { bad: true } }] },
              }),
          },
        ])
      ).json(),
    );
    expect(report.history).toBeNull();
    expect(statusOf(report, 'history')).toBe('error');
    expect(report.registry).not.toBeNull();
  });

  it.each(['1', '12a45', '123456789', '--'].map((p) => [p]))(
    'rejects invalid plate %j with 400',
    async (plate) => {
      const response = await getReport(encodeURIComponent(plate));
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ error: 'invalid_plate' });
    },
  );

  it('accepts short legacy plates', async () => {
    expect((await getReport('870')).statusCode).toBe(200);
  });

  it('rate-limits per IP', async () => {
    const instance = await app({ max: 2, timeWindowMs: 60_000 });
    const codes: number[] = [];
    for (let i = 0; i < 3; i++) {
      codes.push(
        (await instance.inject({ method: 'GET', url: '/api/vehicle/99999999' })).statusCode,
      );
    }
    await instance.close();
    expect(codes).toEqual([200, 200, 429]);
  });
});
