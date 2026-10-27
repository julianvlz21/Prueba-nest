import { describe, expect, it, jest } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/enums/role.enum.js';
import { UsersService } from './users.service.js';

function build(emailTaken = false) {
  const repo: any = {
    existsBy: async () => emailTaken,
    create: (data: object) => ({ ...data }),
    save: jest.fn(async (data: object) => ({ id: 1, ...data })),
  };
  return { service: new UsersService(repo), repo };
}

describe('UsersService.create', () => {
  const dto = { name: 'Tec', email: 'TEC@Fleetcore.com', password: 'Tecnico123*', role: Role.TECHNICIAN };

  it('stores a bcrypt hash, never the plain password, and lowercases the email', async () => {
    const { service, repo } = build();
    const created = await service.create(dto);

    const stored: any = repo.save.mock.calls[0][0];
    expect(stored.email).toBe('tec@fleetcore.com');
    expect(stored.password).not.toBe(dto.password);
    expect(await bcrypt.compare(dto.password, stored.password)).toBe(true);
    expect(created).not.toHaveProperty('password');
  });

  it('rejects a duplicated email with 409', async () => {
    await expect(build(true).service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });
});
