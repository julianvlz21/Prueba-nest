import { Injectable } from '@nestjs/common';
import { MaintenanceStatus } from '../common/enums/maintenance-status.enum.js';
import { MaintenanceType } from '../common/enums/maintenance-type.enum.js';
import { MechanicStatus } from '../common/enums/mechanic-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { WorkshopStatus } from '../common/enums/workshop-status.enum.js';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface.js';
import { MaintenancesService } from '../maintenances/maintenances.service.js';
import { MechanicsService } from '../mechanics/mechanics.service.js';
import { UsersService } from '../users/users.service.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';
import { WorkshopsService } from '../workshops/workshops.service.js';

export interface SeedResult {
  /** What this call created; empty when everything already existed. */
  created: string[];
}

const ADMIN = { name: 'Admin FleetCore', email: 'admin@fleetcore.com', password: 'Admin123*', role: Role.ADMIN };
const TECHNICIANS = [
  { name: 'Técnico Uno', email: 'tecnico1@fleetcore.com', password: 'Tecnico123*', role: Role.TECHNICIAN },
  { name: 'Técnico Dos', email: 'tecnico2@fleetcore.com', password: 'Tecnico123*', role: Role.TECHNICIAN },
];
const MECHANICS = [
  { name: 'Carlos Pérez', email: 'carlos@fleetcore.com', specialty: 'Frenos y suspensión', technician: 0 },
  { name: 'Laura Gómez', email: 'laura@fleetcore.com', specialty: 'Motor y transmisión', technician: 1 },
  { name: 'Andrés Ruiz', email: 'andres@fleetcore.com', specialty: 'Electricidad', inactive: true },
];
const WORKSHOPS = [
  { name: 'Taller Norte', address: 'Calle 80 # 45-12, Bogotá' },
  { name: 'Taller Sur', address: 'Carrera 30 # 10-05, Bogotá', inactive: true },
];
const VEHICLES = [
  { plate: 'ABC123', brand: 'Chevrolet', model: 'NPR', year: 2022, mileage: 45000 },
  { plate: 'DEF456', brand: 'Hino', model: '300', year: 2021, mileage: 62000 },
  { plate: 'GHI789', brand: 'Isuzu', model: 'NKR', year: 2020, mileage: 80000 },
  { plate: 'JKL012', brand: 'Foton', model: 'Aumark', year: 2018, mileage: 150000, inactive: true },
];

/**
 * Initial data for tests. Every step is idempotent (running it twice never duplicates rows)
 * and creates the data it depends on, so each step can be called on its own.
 * Used by both `npm run seed` and the /seed endpoints.
 */
@Injectable()
export class SeedService {
  constructor(
    private readonly users: UsersService,
    private readonly mechanics: MechanicsService,
    private readonly workshops: WorkshopsService,
    private readonly vehicles: VehiclesService,
    private readonly maintenances: MaintenancesService,
  ) {}

  /** 1 ADMIN + 2 TECHNICIAN. */
  async seedUsers(): Promise<SeedResult> {
    const created: string[] = [];
    for (const data of [ADMIN, ...TECHNICIANS]) {
      if (await this.users.findByEmailWithPassword(data.email)) continue;
      await this.users.create(data);
      created.push(`usuario ${data.email}`);
    }
    return { created };
  }

  /** 3 mechanics: 2 active (linked to the technicians) + 1 inactive. */
  async seedMechanics(): Promise<SeedResult> {
    const created = (await this.seedUsers()).created;
    const existing = new Set((await this.mechanics.findAll()).map((m) => m.email));
    for (const { technician, inactive, ...data } of MECHANICS) {
      if (existing.has(data.email)) continue;
      const user = technician === undefined ? undefined : await this.users.findByEmailWithPassword(TECHNICIANS[technician].email);
      const mechanic = await this.mechanics.create({ ...data, userId: user?.id });
      if (inactive) await this.mechanics.setStatus(mechanic.id, MechanicStatus.INACTIVE);
      created.push(`mecánico ${data.email}`);
    }
    return { created };
  }

  /** 2 workshops: 1 active + 1 inactive. */
  async seedWorkshops(): Promise<SeedResult> {
    const created: string[] = [];
    const existing = new Set((await this.workshops.findAll()).map((w) => w.name));
    for (const { inactive, ...data } of WORKSHOPS) {
      if (existing.has(data.name)) continue;
      const workshop = await this.workshops.create(data);
      if (inactive) await this.workshops.setStatus(workshop.id, WorkshopStatus.INACTIVE);
      created.push(`taller ${data.name}`);
    }
    return { created };
  }

  /** 4 vehicles (the IN_MAINTENANCE one is produced by seedMaintenances). */
  async seedVehicles(): Promise<SeedResult> {
    const created: string[] = [];
    const existing = new Set((await this.vehicles.findAll()).map((v) => v.plate));
    for (const { inactive, ...data } of VEHICLES) {
      if (existing.has(data.plate)) continue;
      const vehicle = await this.vehicles.create(data);
      if (inactive) await this.vehicles.deactivate(vehicle.id);
      created.push(`vehículo ${data.plate}`);
    }
    return { created };
  }

  /** 1 COMPLETED (history) + 1 IN_PROGRESS (puts GHI789 in IN_MAINTENANCE). Only when none exist. */
  async seedMaintenances(): Promise<SeedResult> {
    const created = [
      ...(await this.seedMechanics()).created,
      ...(await this.seedWorkshops()).created,
      ...(await this.seedVehicles()).created,
    ];
    if ((await this.maintenances.findAll()).length > 0) return { created };

    const admin = await this.users.findByEmailWithPassword(ADMIN.email);
    const actor: JwtPayload = { sub: admin!.id, email: admin!.email, role: Role.ADMIN };
    const workshop = (await this.workshops.findActive())[0];
    const mechanicsByEmail = new Map((await this.mechanics.findAll()).map((m) => [m.email, m]));
    const vehiclesByPlate = new Map((await this.vehicles.findAll()).map((v) => [v.plate, v]));
    const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

    // Completed history for ABC123.
    const done = await this.maintenances.create(
      {
        type: MaintenanceType.PREVENTIVE,
        description: 'Cambio de aceite y filtros',
        mileage: 45000,
        scheduledDate: hoursAgo(72),
        durationMinutes: 90,
        vehicleId: vehiclesByPlate.get('ABC123')!.id,
        mechanicId: mechanicsByEmail.get('laura@fleetcore.com')!.id,
        workshopId: workshop.id,
      },
      actor,
    );
    await this.maintenances.updateStatus(done.id, { status: MaintenanceStatus.IN_PROGRESS }, actor);
    await this.maintenances.updateStatus(
      done.id,
      {
        status: MaintenanceStatus.COMPLETED,
        workDone: 'Cambio de aceite y filtros',
        finalCost: 350000,
        finishedAt: hoursAgo(70),
        finalMileage: 45010,
      },
      actor,
    );

    // In progress for GHI789 -> the vehicle becomes IN_MAINTENANCE.
    const running = await this.maintenances.create(
      {
        type: MaintenanceType.CORRECTIVE,
        description: 'Reemplazo de pastillas de freno',
        mileage: 80000,
        scheduledDate: hoursAgo(1),
        durationMinutes: 240,
        vehicleId: vehiclesByPlate.get('GHI789')!.id,
        mechanicId: mechanicsByEmail.get('carlos@fleetcore.com')!.id,
        workshopId: workshop.id,
      },
      actor,
    );
    await this.maintenances.updateStatus(running.id, { status: MaintenanceStatus.IN_PROGRESS }, actor);
    created.push('mantenimiento COMPLETED (ABC123)', 'mantenimiento IN_PROGRESS (GHI789)');
    return { created };
  }

  /** Everything, in dependency order. */
  seedAll(): Promise<SeedResult> {
    return this.seedMaintenances();
  }
}

