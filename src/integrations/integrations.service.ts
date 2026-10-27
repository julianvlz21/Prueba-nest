import { Injectable } from '@nestjs/common';
import { VehicleStatus } from '../common/enums/vehicle-status.enum.js';
import { MaintenancesService } from '../maintenances/maintenances.service.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly maintenancesService: MaintenancesService,
  ) {}

  /** Vehicle availability plus its completed maintenance history, shaped for partners. */
  async getVehicleHistoryByPlate(plate: string) {
    const vehicle = await this.vehiclesService.findByPlate(plate);
    const history = await this.maintenancesService.findHistoryByVehicle(vehicle.id);

    return {
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        available: vehicle.status === VehicleStatus.AVAILABLE,
      },
      maintenances: history.map((m) => ({
        id: m.id,
        type: m.type,
        status: m.status,
        description: m.workDone ?? m.description,
        mileage: m.finalMileage ?? m.mileage,
        cost: m.finalCost,
        finishedAt: m.finishedAt,
        mechanic: { id: m.mechanic!.id, name: m.mechanic!.name },
        workshop: { id: m.workshop!.id, name: m.workshop!.name },
      })),
    };
  }
}
