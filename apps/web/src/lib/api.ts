import {
  apiErrorSchema,
  normalizePlate,
  vehicleReportSchema,
  type VehicleReport,
} from '@app/shared';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const STANDALONE = import.meta.env.VITE_STANDALONE === 'true';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function fetchVehicle(plate: string, signal?: AbortSignal): Promise<VehicleReport> {
  if (STANDALONE) {
    const normalized = normalizePlate(plate);
    if (!normalized) throw new ApiRequestError(400, 'Invalid license plate.');
    const { getReport } = await import('./standalone');
    return getReport(normalized);
  }
  const response = await fetch(`${API_BASE}/api/vehicle/${encodeURIComponent(plate)}`, { signal });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    throw new ApiRequestError(
      response.status,
      parsed.success ? parsed.data.message : `HTTP ${response.status}`,
    );
  }
  return vehicleReportSchema.parse(body);
}
