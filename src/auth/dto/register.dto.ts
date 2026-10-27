import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum.js';

export class RegisterDto {
  @ApiProperty({ example: 'Admin FleetCore' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'admin@fleetcore.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin123*', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  @IsEnum(Role)
  role: Role;
}
