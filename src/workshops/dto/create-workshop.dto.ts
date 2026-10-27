import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Taller Norte' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Calle 80 # 45-12, Bogotá' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  address: string;
}
