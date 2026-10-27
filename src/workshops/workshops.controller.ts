import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { WorkshopStatus } from '../common/enums/workshop-status.enum.js';
import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';
import { WorkshopsService } from './workshops.service.js';

@ApiTags('Workshops')
@ApiBearerAuth()
@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar un taller' })
  create(@Body() dto: CreateWorkshopDto) {
    return this.workshopsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar los talleres activos' })
  findActive() {
    return this.workshopsService.findActive();
  }

  @Get('all')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todos los talleres (activos e inactivos)' })
  findAll() {
    return this.workshopsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un taller' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workshopsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un taller' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkshopDto) {
    return this.workshopsService.update(id, dto);
  }

  @Patch(':id/activate')
  @HttpCode(200)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activar un taller' })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.workshopsService.setStatus(id, WorkshopStatus.ACTIVE);
  }

  @Patch(':id/deactivate')
  @HttpCode(200)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Inactivar un taller' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.workshopsService.setStatus(id, WorkshopStatus.INACTIVE);
  }
}
