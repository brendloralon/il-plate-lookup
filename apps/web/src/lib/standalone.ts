import type { VehicleReport } from '@app/shared';
import { createCkanClient } from '../../../api/src/ckan/client';
import { CKAN_BASE_URL } from '../../../api/src/config/datasets';
import { createVehicleReportService } from '../../../api/src/services/vehicleReport';

// Static hosting (GitHub Pages) has no API server; data.gov.il allows CORS,
// so the browser runs the same report service the API uses.
const service = createVehicleReportService({
  client: createCkanClient({ baseUrl: CKAN_BASE_URL }),
});

export function getReport(plate: string): Promise<VehicleReport> {
  return service.getReport(plate);
}
