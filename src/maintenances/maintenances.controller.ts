import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto.js';
import { MaintenancesService } from './maintenances.service.js';

@ApiTags('Maintenances')
@ApiBearerAuth()
@Controller('maintenances')
export class MaintenancesController {
  constructor(private readonly maintenancesService: MaintenancesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear un mantenimiento (estado inicial SCHEDULED)' })
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenancesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todos los mantenimientos' })
  findAll() {
    return this.maintenancesService.findAll();
  }

  // Static routes go before ':id' so they are not parsed as ids.
  @Get('active')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mantenimientos activos (SCHEDULED o IN_PROGRESS)' })
  findActive() {
    return this.maintenancesService.findActive();
  }

  @Get('my')
  @Roles(Role.TECHNICIAN)
  @ApiOperation({ summary: 'Mantenimientos asignados al técnico autenticado' })
  findMine(@CurrentUser() user: JwtPayload) {
    return this.maintenancesService.findMine(user);
  }

  @Get('vehicle/:vehicleId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mantenimientos de un vehículo' })
  findByVehicle(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.maintenancesService.findByVehicle(vehicleId);
  }

  @Get('vehicle/:vehicleId/history')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Historial (COMPLETED) de mantenimientos de un vehículo' })
  findHistory(@Param('vehicleId', ParseIntPipe) vehicleId: number) {
    return this.maintenancesService.findHistoryByVehicle(vehicleId);
  }

  @Get('mechanic/:mechanicId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mantenimientos asignados a un mecánico' })
  findByMechanic(@Param('mechanicId', ParseIntPipe) mechanicId: number) {
    return this.maintenancesService.findByMechanic(mechanicId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Consultar un mantenimiento (el técnico solo los suyos)' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.maintenancesService.findOneFor(id, user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({
    summary: 'Actualizar el estado',
    description:
      'SCHEDULED→IN_PROGRESS|CANCELLED, IN_PROGRESS→COMPLETED|CANCELLED. ' +
      'Para COMPLETED son obligatorios workDone, finalCost, finishedAt y finalMileage.',
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaintenanceStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenancesService.updateStatus(id, dto, user);
  }
}
