import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { MaintenanceStatus } from '../common/enums/maintenance-status.enum.js';
import { MaintenanceType } from '../common/enums/maintenance-type.enum.js';
import { MechanicStatus } from '../common/enums/mechanic-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface.js';
import { MaintenancesService } from '../maintenances/maintenances.service.js';
import { MechanicsService } from '../mechanics/mechanics.service.js';
import { UsersService } from '../users/users.service.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';
import { WorkshopsService } from '../workshops/workshops.service.js';
import { WorkshopStatus } from '../common/enums/workshop-status.enum.js';

/** Idempotent: running it twice does not duplicate rows. */
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const users = app.get(UsersService);
  const mechanics = app.get(MechanicsService);
  const workshops = app.get(WorkshopsService);
  const vehicles = app.get(VehiclesService);
  const maintenances = app.get(MaintenancesService);

  // --- Users ---------------------------------------------------------------
  const seedUser = async (name: string, email: string, password: string, role: Role) => {
    const existing = await users.findByEmailWithPassword(email);
    if (existing) return existing;
    console.log(`+ usuario ${email}`);
    return users.create({ name, email, password, role });
  };
  const admin = await seedUser('Admin FleetCore', 'admin@fleetcore.com', 'Admin123*', Role.ADMIN);
  const tech1 = await seedUser('Técnico Uno', 'tecnico1@fleetcore.com', 'Tecnico123*', Role.TECHNICIAN);
  const tech2 = await seedUser('Técnico Dos', 'tecnico2@fleetcore.com', 'Tecnico123*', Role.TECHNICIAN);

  // --- Mechanics: 2 active (linked to the technicians) + 1 inactive ----------
  const mechanicsByEmail = new Map((await mechanics.findAll()).map((m) => [m.email, m]));
  const mechanicSeeds = [
    { name: 'Carlos Pérez', email: 'carlos@fleetcore.com', specialty: 'Frenos y suspensión', userId: tech1.id },
    { name: 'Laura Gómez', email: 'laura@fleetcore.com', specialty: 'Motor y transmisión', userId: tech2.id },
    { name: 'Andrés Ruiz', email: 'andres@fleetcore.com', specialty: 'Electricidad', inactive: true },
  ];
  for (const { inactive, ...data } of mechanicSeeds) {
    if (mechanicsByEmail.has(data.email)) continue;
    const created = await mechanics.create(data);
    if (inactive) await mechanics.setStatus(created.id, MechanicStatus.INACTIVE);
    mechanicsByEmail.set(data.email, created);
    console.log(`+ mecánico ${data.email}`);
  }

  // --- Workshops: 1 active + 1 inactive --------------------------------------
  let allWorkshops = await workshops.findAll();
  if (allWorkshops.length === 0) {
    await workshops.create({ name: 'Taller Norte', address: 'Calle 80 # 45-12, Bogotá' });
    const closed = await workshops.create({ name: 'Taller Sur', address: 'Carrera 30 # 10-05, Bogotá' });
    await workshops.setStatus(closed.id, WorkshopStatus.INACTIVE);
    allWorkshops = await workshops.findAll();
    console.log('+ talleres');
  }

  // --- Vehicles: 2 AVAILABLE, 1 IN_MAINTENANCE (set below), 1 INACTIVE --------
  const vehicleSeeds = [
    { plate: 'ABC123', brand: 'Chevrolet', model: 'NPR', year: 2022, mileage: 45000 },
    { plate: 'DEF456', brand: 'Hino', model: '300', year: 2021, mileage: 62000 },
    { plate: 'GHI789', brand: 'Isuzu', model: 'NKR', year: 2020, mileage: 80000 },
    { plate: 'JKL012', brand: 'Foton', model: 'Aumark', year: 2018, mileage: 150000 },
  ];
  const vehiclesByPlate = new Map<string, Awaited<ReturnType<typeof vehicles.create>>>();
  for (const data of vehicleSeeds) {
    const existing = (await vehicles.findAll()).find((v) => v.plate === data.plate);
    if (existing) {
      vehiclesByPlate.set(data.plate, existing);
      continue;
    }
    vehiclesByPlate.set(data.plate, await vehicles.create(data));
    console.log(`+ vehículo ${data.plate}`);
  }

  // --- Maintenances (only when none exist): 1 COMPLETED + 1 IN_PROGRESS -------
  if ((await maintenances.findAll()).length === 0) {
    const actor: JwtPayload = { sub: admin.id, email: admin.email, role: Role.ADMIN };
    const workshop = allWorkshops.find((w) => w.status === WorkshopStatus.ACTIVE)!;
    const carlos = mechanicsByEmail.get('carlos@fleetcore.com')!;
    const laura = mechanicsByEmail.get('laura@fleetcore.com')!;
    const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

    // Completed history for ABC123.
    const done = await maintenances.create({
      type: MaintenanceType.PREVENTIVE,
      description: 'Cambio de aceite y filtros',
      mileage: 45000,
      scheduledDate: hoursAgo(72),
      durationMinutes: 90,
      vehicleId: vehiclesByPlate.get('ABC123')!.id,
      mechanicId: laura.id,
      workshopId: workshop.id,
    }, actor);
    await maintenances.updateStatus(done.id, { status: MaintenanceStatus.IN_PROGRESS }, actor);
    await maintenances.updateStatus(
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
    const running = await maintenances.create({
      type: MaintenanceType.CORRECTIVE,
      description: 'Reemplazo de pastillas de freno',
      mileage: 80000,
      scheduledDate: hoursAgo(1),
      durationMinutes: 240,
      vehicleId: vehiclesByPlate.get('GHI789')!.id,
      mechanicId: carlos.id,
      workshopId: workshop.id,
    }, actor);
    await maintenances.updateStatus(running.id, { status: MaintenanceStatus.IN_PROGRESS }, actor);
    console.log('+ mantenimientos');
  }

  // Inactive vehicle (done last so it has no maintenance activity).
  const inactive = vehiclesByPlate.get('JKL012')!;
  if (inactive.status !== 'INACTIVE') await vehicles.deactivate(inactive.id);

  await app.close();
}
await seed();
