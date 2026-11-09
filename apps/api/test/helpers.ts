import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { http, HttpResponse } from 'msw';
import { isDeepStrictEqual } from 'node:util';
import { CKAN_BASE_URL } from '../src/config/datasets';
import type { Fixture } from './fixtures/types';

export const FIXTURE_PLATES = ['36181801', '1000822', '8959871'] as const;

export function loadFixture(plate: string): Fixture {
  return JSON.parse(
    readFileSync(join(import.meta.dirname, 'fixtures', `${plate}.json`), 'utf8'),
  ) as Fixture;
}

/** Records returned by a recorded request for the given resource. */
export function recordsFor(fixture: Fixture, resourceId: string): unknown[] {
  const request = fixture.requests.find((r) => r.resourceId === resourceId);
  if (!request) throw new Error(`No recorded request for ${resourceId} in ${fixture.plate}`);
  const body = request.body as { result: { records: unknown[] } };
  return body.result.records;
}

export const emptyEnvelope = () => ({ success: true, result: { records: [] } });

export interface UpstreamOverride {
  resourceId: string;
  respond: () => Response;
}

/**
 * MSW handler serving recorded fixtures. Unrecorded requests get an empty result
 * (that's what CKAN returns for a plate that isn't in a dataset).
 */
export function ckanHandler(fixtures: Fixture[], overrides: UpstreamOverride[] = []) {
  return http.get(`${CKAN_BASE_URL}datastore_search`, ({ request }) => {
    const url = new URL(request.url);
    const resourceId = url.searchParams.get('resource_id') ?? '';
    const filters: unknown = JSON.parse(url.searchParams.get('filters') ?? '{}');

    const override = overrides.find((o) => o.resourceId === resourceId);
    if (override) return override.respond();

    for (const fixture of fixtures) {
      const hit = fixture.requests.find(
        (r) => r.resourceId === resourceId && isDeepStrictEqual(r.filters, filters),
      );
      if (hit) return HttpResponse.json(hit.body as Record<string, unknown>);
    }
    return HttpResponse.json(emptyEnvelope());
  });
}
