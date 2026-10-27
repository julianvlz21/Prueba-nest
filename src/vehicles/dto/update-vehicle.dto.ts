import { PartialType } from '@nestjs/swagger';
import { CreateVehicleDto } from './create-vehicle.dto.js';

/** Status is not editable here: it changes through maintenances or activate/deactivate. */
export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
