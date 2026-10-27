import { Module } from '@nestjs/common';
import { MaintenancesModule } from '../maintenances/maintenances.module.js';
import { VehiclesModule } from '../vehicles/vehicles.module.js';
import { IntegrationsController } from './integrations.controller.js';
import { IntegrationsService } from './integrations.service.js';

@Module({
  imports: [VehiclesModule, MaintenancesModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
})
export class IntegrationsModule {}
