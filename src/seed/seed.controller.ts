import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator.js';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';
import { SeedService } from './seed.service.js';

/**
 * Runs the seeders over HTTP. Authenticated with x-api-key (not JWT) because on an empty
 * database there is no user yet to log in with. All endpoints are idempotent.
 */
@ApiTags('Seed')
@ApiSecurity('api-key')
@Public() // skips the JWT guard; ApiKeyGuard protects these routes instead
@UseGuards(ApiKeyGuard)
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Ejecutar todos los seeders (usuarios, mecánicos, talleres, vehículos y mantenimientos)' })
  all() {
    return this.seedService.seedAll();
  }

  @Post('users')
  @HttpCode(200)
  @ApiOperation({ summary: 'Crear 1 ADMIN y 2 TECHNICIAN' })
  users() {
    return this.seedService.seedUsers();
  }

  @Post('mechanics')
  @HttpCode(200)
  @ApiOperation({ summary: 'Crear 3 mecánicos (2 activos vinculados a los técnicos y 1 inactivo); incluye usuarios' })
  mechanics() {
    return this.seedService.seedMechanics();
  }

  @Post('workshops')
  @HttpCode(200)
  @ApiOperation({ summary: 'Crear 2 talleres (1 activo y 1 inactivo)' })
  workshops() {
    return this.seedService.seedWorkshops();
  }

  @Post('vehicles')
  @HttpCode(200)
  @ApiOperation({ summary: 'Crear 4 vehículos' })
  vehicles() {
    return this.seedService.seedVehicles();
  }

  @Post('maintenances')
  @HttpCode(200)
  @ApiOperation({ summary: 'Crear 1 mantenimiento COMPLETED y 1 IN_PROGRESS; incluye todo lo anterior' })
  maintenances() {
    return this.seedService.seedMaintenances();
  }
}
