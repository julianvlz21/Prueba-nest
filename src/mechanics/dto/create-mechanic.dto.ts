import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMechanicDto {
  @ApiProperty({ example: 'Carlos Pérez' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'carlos@fleetcore.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Frenos y suspensión' })
  @IsString()
  @MinLength(2)
  specialty: string;

  @ApiPropertyOptional({ description: 'Id de un usuario con rol TECHNICIAN', example: 2 })
  @IsOptional()
  @IsInt()
  userId?: number;
}
