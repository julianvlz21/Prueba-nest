import { describe, expect, it } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/enums/role.enum.js';
import { AuthService } from './auth.service.js';

async function build() {
  const user = {
    id: 1, name: 'Admin', email: 'admin@fleetcore.com', role: Role.ADMIN,
    password: await bcrypt.hash('Admin123*', 4),
  };
  const users: any = { findByEmailWithPassword: async (email: string) => (email === user.email ? user : null) };
  const jwt: any = { signAsync: async (payload: object) => `token:${JSON.stringify(payload)}` };
  return new AuthService(users, jwt);
}

describe('AuthService.login', () => {
  it('returns a JWT signed with the user id, email and role', async () => {
    const result = await (await build()).login({ email: 'admin@fleetcore.com', password: 'Admin123*' });
    expect(result.accessToken).toContain('"sub":1');
    expect(result.accessToken).toContain('"role":"ADMIN"');
    expect(result.user).not.toHaveProperty('password');
  });

  it('rejects a wrong password and an unknown email with the same message', async () => {
    const service = await build();
    await expect(service.login({ email: 'admin@fleetcore.com', password: 'x' })).rejects.toThrow('Credenciales inválidas');
    await expect(service.login({ email: 'nadie@x.com', password: 'x' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
