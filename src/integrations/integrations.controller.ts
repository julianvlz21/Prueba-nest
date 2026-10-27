import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator.js';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';
import { IntegrationsService } from './integrations.service.js';

@ApiTags('Integrations')
@ApiSecurity('api-key')
@Public() // skips the JWT guard: these routes authenticate with x-api-key instead
@UseGuards(ApiKeyGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('vehicles/:plate/maintenances')
  @ApiOperation({ summary: 'Disponibilidad e historial de mantenimientos de un vehículo (para socios externos)' })
  getVehicleMaintenances(@Param('plate') plate: string) {
    return this.integrationsService.getVehicleHistoryByPlate(plate);
  }
}
