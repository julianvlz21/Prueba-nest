import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { MechanicStatus } from '../common/enums/mechanic-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { MechanicsService } from './mechanics.service.js';

@ApiTags('Mechanics')
@ApiBearerAuth()
@Controller('mechanics')
export class MechanicsController {
  constructor(private readonly mechanicsService: MechanicsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar un mecánico' })
  create(@Body() dto: CreateMechanicDto) {
    return this.mechanicsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todos los mecánicos' })
  findAll() {
    return this.mechanicsService.findAll();
  }

  // Declared before ':id' so "me" is not parsed as an id.
  @Get('me')
  @Roles(Role.TECHNICIAN)
  @ApiOperation({ summary: 'Perfil de mecánico del técnico autenticado' })
  me(@CurrentUser() user: JwtPayload) {
    return this.mechanicsService.findByUserId(user.sub);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Consultar un mecánico' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar un mecánico' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMechanicDto) {
    return this.mechanicsService.update(id, dto);
  }

  @Patch(':id/activate')
  @HttpCode(200)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activar un mecánico' })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicsService.setStatus(id, MechanicStatus.ACTIVE);
  }

  @Patch(':id/deactivate')
  @HttpCode(200)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Inactivar un mecánico (conserva su historial)' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.mechanicsService.setStatus(id, MechanicStatus.INACTIVE);
  }
}
