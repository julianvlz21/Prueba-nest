import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehiclesService } from './vehicles.service.js';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar un vehículo' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vehículos (cualquier usuario autenticado)' })
  findAll() {
    return this.vehiclesService.findAll();
  }

  // Declared before ':id' so "plate" is not parsed as an id.
  @Get('plate/:plate')
  @ApiOperation({ summary: 'Consultar un vehículo por placa' })
  findByPlate(@Param('plate') plate: string) {
    return this.vehiclesService.findByPlate(plate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un vehículo por id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un vehículo' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @HttpCode(200)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Inactivar (eliminación lógica); conserva el historial' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.deactivate(id);
  }

  @Patch(':id/activate')
  @HttpCode(200)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reactivar un vehículo inactivo (queda AVAILABLE)' })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.activate(id);
  }
}
