import type { FastifyInstance } from 'fastify';
import { normalizePlate, type ApiError, type VehicleReport } from '@app/shared';
import type { VehicleReportService } from '../services/vehicleReport';

export function registerVehicleRoutes(app: FastifyInstance, service: VehicleReportService) {
  app.get<{ Params: { plate: string }; Reply: VehicleReport | ApiError }>(
    '/api/vehicle/:plate',
    async (request, reply) => {
      const plate = normalizePlate(request.params.plate);
      if (!plate) {
        return reply.code(400).send({
          error: 'invalid_plate',
          message: 'License plate must contain 2–8 digits (dashes and spaces are allowed).',
        });
      }
      return service.getReport(plate);
    },
  );
}
