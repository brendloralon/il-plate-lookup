import { QueryClient } from '@tanstack/react-query';
import { ApiRequestError } from './api';

export const VEHICLE_STALE_TIME_MS = 60 * 60 * 1000;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: VEHICLE_STALE_TIME_MS,
        refetchOnWindowFocus: false,
        // Client errors (bad plate, rate limit) won't succeed on retry.
        retry: (failureCount, error) =>
          !(error instanceof ApiRequestError && error.status < 500) && failureCount < 1,
      },
    },
  });
}
