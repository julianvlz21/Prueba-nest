import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { MaintenanceType } from '../../common/enums/maintenance-type.enum.js';

export class CreateMaintenanceDto {
  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.PREVENTIVE })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @ApiProperty({ example: 'Cambio de aceite y filtros' })
  @IsString()
  @MinLength(3)
  description: string;

  @ApiProperty({ example: 45000, description: 'No puede ser menor al kilometraje actual del vehículo' })
  @IsInt()
  @Min(0)
  mileage: number;

  @ApiProperty({ example: '2026-11-03T07:30:00.000Z', description: 'Inicio programado' })
  @IsDateString()
  scheduledDate: string;

  @ApiPropertyOptional({ example: 90, default: 60, description: 'Duración estimada en minutos' })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  vehicleId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  mechanicId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  workshopId: number;
}
