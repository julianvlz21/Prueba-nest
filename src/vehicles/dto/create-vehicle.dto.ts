import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC123' })
  @IsString()
  @MinLength(3)
  plate: string;

  @ApiProperty({ example: 'Chevrolet' })
  @IsString()
  @MinLength(2)
  brand: string;

  @ApiProperty({ example: 'NPR' })
  @IsString()
  @MinLength(1)
  model: string;

  @ApiProperty({ example: 2022 })
  @IsInt()
  @Min(1950)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 45000 })
  @IsInt()
  @Min(0)
  mileage: number;
}
