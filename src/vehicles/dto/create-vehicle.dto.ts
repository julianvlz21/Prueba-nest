import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { MAX_INT } from '../../common/constants/limits.js';

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC123' })
  @IsString()
  @MinLength(3)
  @MaxLength(15)
  plate: string;

  @ApiProperty({ example: 'Chevrolet' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  brand: string;

  @ApiProperty({ example: 'NPR' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  model: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  @Min(1950)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 45000 })
  @IsInt()
  @Min(0)
  @Max(MAX_INT)
  mileage: number;
}
