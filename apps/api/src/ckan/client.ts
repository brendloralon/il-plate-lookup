import { LRUCache } from 'lru-cache';
import { z } from 'zod';

export type CkanFilterValue = string | number | (string | number)[];
export type CkanFilters = Record<string, CkanFilterValue>;

export interface CkanSearchOptions {
  limit?: number;
}

export interface CkanClient {
  search(resourceId: string, filters: CkanFilters, options?: CkanSearchOptions): Promise<unknown[]>;
}

export class CkanError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'CkanError';
  }
}

const envelopeSchema = z.object({
  success: z.literal(true),
  result: z.object({ records: z.array(z.unknown()) }),
});

export interface CkanClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  /** Additional attempts after the first failure. */
  retries?: number;
  retryDelayMs?: number;
  cacheTtlMs?: number;
  cacheMaxEntries?: number;
  fetchImpl?: typeof fetch;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createCkanClient({
  baseUrl,
  timeoutMs = 8_000,
  retries = 1,
  retryDelayMs = 300,
  cacheTtlMs = 12 * 60 * 60 * 1000,
  cacheMaxEntries = 5_000,
  fetchImpl = fetch,
}: CkanClientOptions): CkanClient {
  // Cache key is resourceId + filters (which contain the plate), so it's effectively dataset+plate.
  const cache = new LRUCache<string, unknown[]>({ max: cacheMaxEntries, ttl: cacheTtlMs });

  async function fetchOnce(url: string): Promise<unknown[]> {
    let response: Response;
    try {
      response = await fetchImpl(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { accept: 'application/json' },
      });
    } catch (err) {
      const reason = err instanceof Error ? err.name : 'unknown';
      throw new CkanError(`Upstream request failed (${reason})`, true);
    }
    if (!response.ok) {
      const retryable = response.status >= 500 || response.status === 429;
      throw new CkanError(`Upstream responded ${response.status}`, retryable);
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new CkanError('Upstream returned non-JSON body', true);
    }
    const parsed = envelopeSchema.safeParse(body);
    if (!parsed.success) throw new CkanError('Upstream returned an unexpected envelope', false);
    return parsed.data.result.records;
  }

  return {
    async search(resourceId, filters, { limit = 5 } = {}) {
      const params = new URLSearchParams({
        resource_id: resourceId,
        filters: JSON.stringify(filters),
        limit: String(limit),
      });
      const url = `${baseUrl}datastore_search?${params.toString()}`;
      const cached = cache.get(url);
      if (cached) return cached;

      for (let attempt = 0; ; attempt++) {
        try {
          const records = await fetchOnce(url);
          cache.set(url, records);
          return records;
        } catch (err) {
          const retryable = err instanceof CkanError && err.retryable;
          if (!retryable || attempt >= retries) throw err;
          await sleep(retryDelayMs * 2 ** attempt);
        }
      }
    },
  };
}
