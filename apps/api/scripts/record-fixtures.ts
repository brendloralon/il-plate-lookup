/**
 * Records real data.gov.il responses for a few plates into test/fixtures/<plate>.json.
 * Runs the real service with a fetch wrapper, so fixtures contain exactly the requests it makes.
 *
 *   pnpm --filter @app/api fixtures:record [plate ...]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCkanClient } from '../src/ckan/client';
import { CKAN_BASE_URL } from '../src/config/datasets';
import { createVehicleReportService } from '../src/services/vehicleReport';
import type { Fixture, FixtureRequest } from '../test/fixtures/types';

const DEFAULT_PLATES = ['36181801', '1000822', '8959871'];
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'test', 'fixtures');

async function record(plate: string): Promise<Fixture> {
  const requests: FixtureRequest[] = [];
  const recordingFetch: typeof fetch = async (input, init) => {
    const response = await fetch(input, init);
    const url = new URL(typeof input === 'string' ? input : input.toString());
    requests.push({
      resourceId: url.searchParams.get('resource_id') ?? '',
      filters: JSON.parse(url.searchParams.get('filters') ?? '{}') as Record<string, unknown>,
      status: response.status,
      body: (await response.clone().json()) as unknown,
    });
    return response;
  };

  const client = createCkanClient({ baseUrl: CKAN_BASE_URL, fetchImpl: recordingFetch });
  const report = await createVehicleReportService({ client }).getReport(plate);
  const failed = report.sources.filter((s) => s.status === 'error').map((s) => s.id);
  if (failed.length > 0) throw new Error(`Plate ${plate}: upstream errors in ${failed.join(', ')}`);
  return { plate, recordedAt: new Date().toISOString(), requests };
}

const plates = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_PLATES;
await mkdir(outDir, { recursive: true });
for (const plate of plates) {
  const fixture = await record(plate);
  await writeFile(join(outDir, `${plate}.json`), `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(`recorded ${plate}: ${fixture.requests.length} requests`);
}
