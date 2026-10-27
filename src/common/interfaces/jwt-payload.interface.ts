import { Role } from '../enums/role.enum.js';

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}
