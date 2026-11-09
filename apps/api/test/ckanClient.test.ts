import { describe, expect, it, vi } from 'vitest';
import { createCkanClient } from '../src/ckan/client';

const ok = (records: unknown[]) =>
  new Response(JSON.stringify({ success: true, result: { records } }), { status: 200 });

function client(fetchImpl: typeof fetch, timeoutMs = 1_000) {
  return createCkanClient({ baseUrl: 'https://ckan.test/', fetchImpl, retryDelayMs: 0, timeoutMs });
}

describe('createCkanClient', () => {
  it('sends exact filters and returns records', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(ok([{ a: 1 }]));
    const records = await client(fetchImpl).search('res-1', { 'MISPAR RECHEV': 123 }, { limit: 7 });
    expect(records).toEqual([{ a: 1 }]);
    const url = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url.pathname).toBe('/datastore_search');
    expect(url.searchParams.get('resource_id')).toBe('res-1');
    expect(url.searchParams.get('filters')).toBe('{"MISPAR RECHEV":123}');
    expect(url.searchParams.get('limit')).toBe('7');
    expect(url.searchParams.has('q')).toBe(false);
  });

  it('caches by dataset + filters', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => ok([]));
    const c = client(fetchImpl);
    await c.search('res-1', { p: 1 });
    await c.search('res-1', { p: 1 });
    await c.search('res-1', { p: 2 });
    await c.search('res-2', { p: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('retries once on a 5xx and then succeeds', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('boom', { status: 503 }))
      .mockResolvedValueOnce(ok([{ a: 1 }]));
    await expect(client(fetchImpl).search('r', { p: 1 })).resolves.toEqual([{ a: 1 }]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('gives up after one retry', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response('', { status: 500 }));
    await expect(client(fetchImpl).search('r', { p: 1 })).rejects.toThrow('Upstream responded 500');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not retry a 4xx or cache failures', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response('', { status: 400 }));
    const c = client(fetchImpl);
    await expect(c.search('r', { p: 1 })).rejects.toThrow();
    await expect(c.search('r', { p: 1 })).rejects.toThrow();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('times out slow upstream calls and retries', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    );
    await expect(client(fetchImpl, 20).search('r', { p: 1 })).rejects.toThrow(/TimeoutError/);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('rejects an unexpected envelope', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ success: false, error: {} })));
    await expect(client(fetchImpl).search('r', { p: 1 })).rejects.toThrow('unexpected envelope');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
