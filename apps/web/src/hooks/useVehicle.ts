import { useQuery } from '@tanstack/react-query';
import { fetchVehicle } from '../lib/api';
import { VEHICLE_STALE_TIME_MS } from '../lib/queryClient';

export const vehicleQueryKey = (plate: string) => ['vehicle', plate] as const;

export function useVehicle(plate: string | null) {
  return useQuery({
    queryKey: vehicleQueryKey(plate ?? ''),
    queryFn: ({ signal }) => fetchVehicle(plate ?? '', signal),
    enabled: plate !== null,
    staleTime: VEHICLE_STALE_TIME_MS,
  });
}
