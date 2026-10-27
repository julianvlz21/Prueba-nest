import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MaintenanceStatus } from '../../common/enums/maintenance-status.enum.js';

export class UpdateMaintenanceStatusDto {
  @ApiProperty({ enum: MaintenanceStatus, example: MaintenanceStatus.IN_PROGRESS })
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus;

  // The four fields below are mandatory only when status = COMPLETED (checked in the service).
  @ApiPropertyOptional({ example: 'Cambio de aceite y filtros realizado' })
  @IsOptional()
  @IsString()
  workDone?: string;

  @ApiPropertyOptional({ example: 350000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  finalCost?: number;

  @ApiPropertyOptional({ example: '2026-11-03T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  finishedAt?: string;

  @ApiPropertyOptional({ example: 45010 })
  @IsOptional()
  @IsInt()
  @Min(0)
  finalMileage?: number;
}
