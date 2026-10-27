import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { MaintenanceStatus } from '../common/enums/maintenance-status.enum.js';
import { MaintenanceType } from '../common/enums/maintenance-type.enum.js';
import { MechanicStatus } from '../common/enums/mechanic-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { VehicleStatus } from '../common/enums/vehicle-status.enum.js';
import { WorkshopStatus } from '../common/enums/workshop-status.enum.js';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface.js';
import { Mechanic } from '../mechanics/entities/mechanic.entity.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { Workshop } from '../workshops/entities/workshop.entity.js';
import { Maintenance } from './entities/maintenance.entity.js';
import { MaintenanceAudit } from './entities/maintenance-audit.entity.js';
import { MaintenancesService } from './maintenances.service.js';

const { SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED } = MaintenanceStatus;

const admin: JwtPayload = { sub: 1, email: 'admin@fleetcore.com', role: Role.ADMIN };
const technician: JwtPayload = { sub: 3, email: 'tecnico1@fleetcore.com', role: Role.TECHNICIAN };

/**
 * Builds the service with an in-memory fake of the TypeORM EntityManager, so the
 * business rules can be tested without a database. `state` is what the "database" holds.
 */
function setup(overrides: {
  maintenance?: Partial<Maintenance>;
  vehicle?: Partial<Vehicle>;
  mechanic?: Partial<Mechanic>;
  workshop?: Partial<Workshop>;
  vehicleHasActive?: boolean;
  mechanicInProgress?: boolean;
  overlap?: Partial<Maintenance> | null;
  technicianMechanic?: Partial<Mechanic> | null;
} = {}) {
  const state = {
    maintenance: {
      id: 10, status: SCHEDULED, vehicleId: 1, mechanicId: 2, workshopId: 1, mileage: 1000,
      ...overrides.maintenance,
    } as Maintenance,
    vehicle: {
      id: 1, plate: 'ABC123', mileage: 1000, status: VehicleStatus.AVAILABLE, ...overrides.vehicle,
    } as Vehicle,
    mechanic: { id: 2, name: 'Laura', status: MechanicStatus.ACTIVE, ...overrides.mechanic } as Mechanic,
    workshop: { id: 1, name: 'Taller Norte', status: WorkshopStatus.ACTIVE, ...overrides.workshop } as Workshop,
  };
  const saved: unknown[] = [];

  const queryBuilder: any = {
    where: () => queryBuilder,
    andWhere: () => queryBuilder,
    getOne: async () => overrides.overlap ?? null,
  };
  const manager: any = {
    findOne: async (entity: unknown) =>
      entity === Maintenance ? state.maintenance
      : entity === Vehicle ? state.vehicle
      : entity === Mechanic ? state.mechanic
      : null,
    findOneOrFail: async (entity: unknown) => (entity === Vehicle ? state.vehicle : state.maintenance),
    findOneBy: async (entity: unknown) =>
      entity === Workshop ? state.workshop
      : entity === Mechanic ? (overrides.technicianMechanic === undefined ? null : overrides.technicianMechanic)
      : null,
    existsBy: async (_entity: unknown, where: any) =>
      'vehicleId' in where ? !!overrides.vehicleHasActive : !!overrides.mechanicInProgress,
    createQueryBuilder: () => queryBuilder,
    create: (_entity: unknown, data: object) => ({ ...data }),
    save: async (data: any) => {
      saved.push(data);
      return { id: 99, ...data };
    },
  };
  const dataSource: any = { transaction: async (cb: (m: unknown) => unknown) => cb(manager), manager };
  const repo: any = { findOne: jest.fn(async () => state.maintenance) };

  const service = new MaintenancesService(repo, {} as any, {} as any, {} as any, dataSource);
  const auditsSaved = () => saved.filter((s: any) => 'toStatus' in s) as Partial<MaintenanceAudit>[];
  return { service, state, auditsSaved };
}

const createDto = {
  type: MaintenanceType.PREVENTIVE,
  description: 'Cambio de aceite',
  mileage: 1000,
  scheduledDate: '2026-12-01T07:30:00.000Z',
  durationMinutes: 90,
  vehicleId: 1,
  mechanicId: 2,
  workshopId: 1,
};

describe('MaintenancesService.updateStatus - state machine', () => {
  it('SCHEDULED -> IN_PROGRESS puts the vehicle IN_MAINTENANCE and writes an audit row', async () => {
    const { service, state, auditsSaved } = setup();
    await service.updateStatus(10, { status: IN_PROGRESS }, admin);

    expect(state.maintenance.status).toBe(IN_PROGRESS);
    expect(state.vehicle.status).toBe(VehicleStatus.IN_MAINTENANCE);
    expect(auditsSaved()).toEqual([
      expect.objectContaining({ fromStatus: SCHEDULED, toStatus: IN_PROGRESS, changedByEmail: admin.email }),
    ]);
  });

  it('IN_PROGRESS -> COMPLETED frees the vehicle and updates its mileage', async () => {
    const { service, state } = setup({ maintenance: { status: IN_PROGRESS }, vehicle: { status: VehicleStatus.IN_MAINTENANCE } });
    await service.updateStatus(
      10,
      { status: COMPLETED, workDone: 'Cambio de aceite', finalCost: 350000, finishedAt: '2026-12-01T09:00:00Z', finalMileage: 1050 },
      admin,
    );

    expect(state.vehicle.status).toBe(VehicleStatus.AVAILABLE);
    expect(state.vehicle.mileage).toBe(1050);
    expect(state.maintenance).toMatchObject({ status: COMPLETED, finalCost: 350000, finalMileage: 1050 });
  });

  it('cancelling an IN_PROGRESS maintenance releases the vehicle', async () => {
    const { service, state } = setup({ maintenance: { status: IN_PROGRESS }, vehicle: { status: VehicleStatus.IN_MAINTENANCE } });
    await service.updateStatus(10, { status: CANCELLED }, admin);
    expect(state.vehicle.status).toBe(VehicleStatus.AVAILABLE);
  });

  it.each([
    [COMPLETED, IN_PROGRESS],
    [COMPLETED, SCHEDULED],
    [CANCELLED, IN_PROGRESS],
    [CANCELLED, COMPLETED],
    [SCHEDULED, COMPLETED],
  ])('rejects the invalid transition %s -> %s with 409', async (from, to) => {
    const { service, auditsSaved } = setup({ maintenance: { status: from } });
    await expect(service.updateStatus(10, { status: to }, admin)).rejects.toBeInstanceOf(ConflictException);
    expect(auditsSaved()).toHaveLength(0);
  });

  it('cannot complete without the mandatory closing data', async () => {
    const { service } = setup({ maintenance: { status: IN_PROGRESS } });
    await expect(service.updateStatus(10, { status: COMPLETED, workDone: 'x' }, admin)).rejects.toThrow(
      /faltan: finalCost, finishedAt, finalMileage/,
    );
  });

  it('cannot complete with a final mileage below the vehicle mileage', async () => {
    const { service } = setup({ maintenance: { status: IN_PROGRESS } });
    await expect(
      service.updateStatus(
        10,
        { status: COMPLETED, workDone: 'x', finalCost: 1, finishedAt: '2026-12-01T09:00:00Z', finalMileage: 10 },
        admin,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('a mechanic cannot start a second maintenance while one is IN_PROGRESS', async () => {
    const { service } = setup({ mechanicInProgress: true });
    await expect(service.updateStatus(10, { status: IN_PROGRESS }, admin)).rejects.toThrow(/en proceso/);
  });

  it('a technician cannot update a maintenance assigned to another mechanic', async () => {
    const { service } = setup({ technicianMechanic: { id: 77 } });
    await expect(service.updateStatus(10, { status: IN_PROGRESS }, technician)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('a technician can update their own maintenance', async () => {
    const { service, state } = setup({ technicianMechanic: { id: 2 } });
    await service.updateStatus(10, { status: IN_PROGRESS }, technician);
    expect(state.maintenance.status).toBe(IN_PROGRESS);
  });
});

describe('MaintenancesService.create - business rules', () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(() => (ctx = setup()));

  it('creates a SCHEDULED maintenance and records the first audit row', async () => {
    await ctx.service.create(createDto, admin);
    expect(ctx.auditsSaved()).toEqual([
      expect.objectContaining({ fromStatus: null, toStatus: SCHEDULED, changedById: admin.sub }),
    ]);
  });

  it('rejects a maintenance for an INACTIVE vehicle', async () => {
    const { service } = setup({ vehicle: { status: VehicleStatus.INACTIVE } });
    await expect(service.create(createDto, admin)).rejects.toThrow(/INACTIVO/);
  });

  it('rejects an inactive mechanic and an inactive workshop', async () => {
    await expect(
      setup({ mechanic: { status: MechanicStatus.INACTIVE } }).service.create(createDto, admin),
    ).rejects.toThrow(/mecánico .* inactivo/);
    await expect(
      setup({ workshop: { status: WorkshopStatus.INACTIVE } }).service.create(createDto, admin),
    ).rejects.toThrow(/taller .* inactivo/);
  });

  it('rejects a mileage lower than the vehicle current mileage', async () => {
    await expect(ctx.service.create({ ...createDto, mileage: 5 }, admin)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a second active maintenance for the same vehicle', async () => {
    const { service } = setup({ vehicleHasActive: true });
    await expect(service.create(createDto, admin)).rejects.toThrow(/ya tiene un mantenimiento activo/);
  });

  it('rejects a schedule that overlaps another active maintenance of the mechanic', async () => {
    const { service } = setup({ overlap: { id: 5 } });
    await expect(service.create(createDto, admin)).rejects.toThrow(/se cruza con ese horario/);
  });
});
