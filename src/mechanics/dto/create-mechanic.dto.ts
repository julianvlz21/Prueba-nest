import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { MAX_INT } from '../../common/constants/limits.js';

export class CreateMechanicDto {
  @ApiProperty({ example: 'Carlos Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'carlos@fleetcore.com' })
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiProperty({ example: 'Frenos y suspensión' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  specialty: string;

  @ApiPropertyOptional({ description: 'Id de un usuario con rol TECHNICIAN', example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_INT)
  userId?: number;
}
