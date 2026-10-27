import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Taller Norte' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'Calle 80 # 45-12, Bogotá' })
  @IsString()
  @MinLength(5)
  address: string;
}
