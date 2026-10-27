import { describe, expect, it } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum.js';
import { RolesGuard } from './roles.guard.js';

const contextFor = (user: unknown): any => ({
  getHandler: () => null,
  getClass: () => null,
  switchToHttp: () => ({ getRequest: () => ({ user }) }),
});
const guardRequiring = (roles?: Role[]) =>
  new RolesGuard({ getAllAndOverride: () => roles } as unknown as Reflector);

describe('RolesGuard', () => {
  it('allows routes without @Roles()', () => {
    expect(guardRequiring(undefined).canActivate(contextFor({ role: Role.TECHNICIAN }))).toBe(true);
  });

  it('allows a user whose role is listed', () => {
    expect(guardRequiring([Role.ADMIN]).canActivate(contextFor({ role: Role.ADMIN }))).toBe(true);
  });

  it('denies a user whose role is not listed with 403', () => {
    expect(() => guardRequiring([Role.ADMIN]).canActivate(contextFor({ role: Role.TECHNICIAN }))).toThrow(
      ForbiddenException,
    );
  });
});
