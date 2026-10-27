import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { MAX_INT } from '../../common/constants/limits.js';
import { MaintenanceType } from '../../common/enums/maintenance-type.enum.js';

export class CreateMaintenanceDto {
  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.PREVENTIVE })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @ApiProperty({ example: 'Cambio de aceite y filtros' })
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  description: string;

  @ApiProperty({ example: 45000, description: 'No puede ser menor al kilometraje actual del vehículo' })
  @IsInt()
  @Min(0)
  @Max(MAX_INT)
  mileage: number;

  @ApiProperty({ example: '2026-11-03T07:30:00.000Z', description: 'Inicio programado' })
  @IsDateString()
  scheduledDate: string;

  @ApiPropertyOptional({ example: 90, default: 60, description: 'Duración estimada en minutos' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(43_200) // 30 days
  durationMinutes?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(MAX_INT)
  vehicleId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(MAX_INT)
  mechanicId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(MAX_INT)
  workshopId: number;
}
