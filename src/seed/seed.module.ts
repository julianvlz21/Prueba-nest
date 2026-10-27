import { Module } from '@nestjs/common';
import { MaintenancesModule } from '../maintenances/maintenances.module.js';
import { MechanicsModule } from '../mechanics/mechanics.module.js';
import { UsersModule } from '../users/users.module.js';
import { VehiclesModule } from '../vehicles/vehicles.module.js';
import { WorkshopsModule } from '../workshops/workshops.module.js';
import { SeedController } from './seed.controller.js';
import { SeedService } from './seed.service.js';

@Module({
  imports: [UsersModule, MechanicsModule, WorkshopsModule, VehiclesModule, MaintenancesModule],
  controllers: [SeedController],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
