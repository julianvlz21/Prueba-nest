import { describe, expect, it } from '@jest/globals';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { MechanicStatus } from '../common/enums/mechanic-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { MechanicsService } from './mechanics.service.js';

function build(opts: { mechanic?: any; emailTaken?: boolean; userLinked?: boolean; user?: any } = {}) {
  const repo: any = {
    findOneBy: async () => opts.mechanic ?? null,
    // First existsBy call checks the email, the second one the user link.
    existsBy: async (where: any) => ('userId' in where ? !!opts.userLinked : !!opts.emailTaken),
    create: (data: object) => ({ ...data }),
    save: async (data: object) => data,
  };
  const users: any = { findById: async () => opts.user ?? null };
  return new MechanicsService(repo, users);
}

const dto = { name: 'Carlos', email: 'Carlos@Fleetcore.com', specialty: 'Frenos' };

describe('MechanicsService', () => {
  it('lowercases the email on create', async () => {
    expect(await build().create(dto)).toMatchObject({ email: 'carlos@fleetcore.com', userId: null });
  });

  it('rejects a duplicated email with 409', async () => {
    await expect(build({ emailTaken: true }).create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('only links users that exist and have the TECHNICIAN role', async () => {
    await expect(build().create({ ...dto, userId: 5 })).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      build({ user: { id: 5, role: Role.ADMIN } }).create({ ...dto, userId: 5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      build({ user: { id: 5, role: Role.TECHNICIAN }, userLinked: true }).create({ ...dto, userId: 5 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('inactivates a mechanic instead of deleting it', async () => {
    const mechanic = { id: 1, status: MechanicStatus.ACTIVE };
    const result = await build({ mechanic }).setStatus(1, MechanicStatus.INACTIVE);
    expect(result.status).toBe(MechanicStatus.INACTIVE);
  });

  it('throws 404 for an unknown mechanic and for a technician without profile', async () => {
    await expect(build().findOne(9)).rejects.toBeInstanceOf(NotFoundException);
    await expect(build().findByUserId(9)).rejects.toThrow(/no está vinculado/);
  });
});
