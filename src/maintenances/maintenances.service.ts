import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { MaintenanceStatus } from '../common/enums/maintenance-status.enum.js';
import { MechanicStatus } from '../common/enums/mechanic-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { VehicleStatus } from '../common/enums/vehicle-status.enum.js';
import { WorkshopStatus } from '../common/enums/workshop-status.enum.js';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface.js';
import { Mechanic } from '../mechanics/entities/mechanic.entity.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { Workshop } from '../workshops/entities/workshop.entity.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto.js';
import { Maintenance } from './entities/maintenance.entity.js';

const { SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED } = MaintenanceStatus;

/** Maintenances that still occupy the vehicle / the mechanic's calendar. */
const ACTIVE_STATUSES = [SCHEDULED, IN_PROGRESS];

/** Allowed state machine. COMPLETED and CANCELLED are terminal. */
const TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  [SCHEDULED]: [IN_PROGRESS, CANCELLED],
  [IN_PROGRESS]: [COMPLETED, CANCELLED],
  [COMPLETED]: [],
  [CANCELLED]: [],
};

const RELATIONS = { vehicle: true, mechanic: true, workshop: true } as const;

@Injectable()
export class MaintenancesService {
  constructor(
    @InjectRepository(Maintenance) private readonly repo: Repository<Maintenance>,
    @InjectRepository(Mechanic) private readonly mechanicsRepo: Repository<Mechanic>,
    @InjectRepository(Vehicle) private readonly vehiclesRepo: Repository<Vehicle>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates a SCHEDULED maintenance. Runs in a transaction and locks the vehicle and
   * mechanic rows so two concurrent requests cannot both pass the "one active per
   * vehicle" and "no overlapping schedule per mechanic" checks.
   */
  async create(dto: CreateMaintenanceDto): Promise<Maintenance> {
    const start = new Date(dto.scheduledDate);
    const end = new Date(start.getTime() + (dto.durationMinutes ?? 60) * 60_000);

    const id = await this.dataSource.transaction(async (manager) => {
      const vehicle = await manager.findOne(Vehicle, {
        where: { id: dto.vehicleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!vehicle) throw new NotFoundException(`No se puede crear el mantenimiento: el vehículo ${dto.vehicleId} no existe`);
      if (vehicle.status === VehicleStatus.INACTIVE) {
        throw new ConflictException(`El vehículo ${vehicle.plate} está INACTIVO y no admite mantenimientos`);
      }

      const mechanic = await manager.findOne(Mechanic, {
        where: { id: dto.mechanicId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!mechanic) throw new NotFoundException(`No se puede asignar: el mecánico ${dto.mechanicId} no existe`);
      if (mechanic.status === MechanicStatus.INACTIVE) {
        throw new ConflictException(`El mecánico ${mechanic.name} está inactivo`);
      }

      const workshop = await manager.findOneBy(Workshop, { id: dto.workshopId });
      if (!workshop) throw new NotFoundException(`No se puede asignar: el taller ${dto.workshopId} no existe`);
      if (workshop.status === WorkshopStatus.INACTIVE) {
        throw new ConflictException(`El taller ${workshop.name} está inactivo`);
      }

      if (dto.mileage < vehicle.mileage) {
        throw new BadRequestException(
          `El kilometraje (${dto.mileage}) no puede ser menor al actual del vehículo (${vehicle.mileage})`,
        );
      }

      if (await manager.existsBy(Maintenance, { vehicleId: vehicle.id, status: In(ACTIVE_STATUSES) })) {
        throw new ConflictException(`El vehículo ${vehicle.plate} ya tiene un mantenimiento activo`);
      }

      // Overlap if existing.start < new.end AND existing.end > new.start.
      // Strict comparisons make back-to-back windows (9:00 end / 9:00 start) valid.
      const overlap = await manager
        .createQueryBuilder(Maintenance, 'm')
        .where('m.mechanicId = :mechanicId', { mechanicId: mechanic.id })
        .andWhere('m.status IN (:...active)', { active: ACTIVE_STATUSES })
        .andWhere('m.scheduledDate < :end AND m.scheduledEndDate > :start', { start, end })
        .getOne();
      if (overlap) {
        throw new ConflictException(
          `El mecánico ${mechanic.name} ya tiene el mantenimiento ${overlap.id} que se cruza con ese horario`,
        );
      }

      const saved = await manager.save(
        manager.create(Maintenance, {
          type: dto.type,
          description: dto.description,
          mileage: dto.mileage,
          scheduledDate: start,
          scheduledEndDate: end,
          status: SCHEDULED,
          vehicleId: vehicle.id,
          mechanicId: mechanic.id,
          workshopId: workshop.id,
        }),
      );
      return saved.id;
    });

    return this.findOne(id);
  }

  /**
   * Moves a maintenance through its state machine and keeps the vehicle in sync
   * (IN_PROGRESS -> IN_MAINTENANCE, COMPLETED/CANCELLED -> AVAILABLE) in one transaction.
   * A TECHNICIAN may only touch maintenances assigned to their own mechanic profile.
   */
  async updateStatus(id: number, dto: UpdateMaintenanceStatusDto, actor: JwtPayload): Promise<Maintenance> {
    await this.dataSource.transaction(async (manager) => {
      const maintenance = await manager.findOne(Maintenance, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!maintenance) throw new NotFoundException(`Mantenimiento ${id} no encontrado`);
      await this.assertCanAccess(maintenance, actor, manager);

      const from = maintenance.status;
      const to = dto.status;
      if (!TRANSITIONS[from].includes(to)) {
        throw new ConflictException(
          `Transición inválida: un mantenimiento ${from} no puede pasar a ${to}` +
            (TRANSITIONS[from].length ? `. Permitidas: ${TRANSITIONS[from].join(', ')}` : ' (estado final)'),
        );
      }

      const vehicle = await manager.findOneOrFail(Vehicle, {
        where: { id: maintenance.vehicleId },
        lock: { mode: 'pessimistic_write' },
      });

      if (to === IN_PROGRESS) {
        if (vehicle.status === VehicleStatus.INACTIVE) {
          throw new ConflictException(`El vehículo ${vehicle.plate} está INACTIVO`);
        }
        // A mechanic can work on one job at a time.
        if (await manager.existsBy(Maintenance, { mechanicId: maintenance.mechanicId, status: IN_PROGRESS })) {
          throw new ConflictException('El mecánico ya tiene un mantenimiento en proceso');
        }
        vehicle.status = VehicleStatus.IN_MAINTENANCE;
        await manager.save(vehicle);
      }

      if (to === COMPLETED) {
        const missing = (['workDone', 'finalCost', 'finishedAt', 'finalMileage'] as const).filter(
          (field) => dto[field] === undefined || dto[field] === null,
        );
        if (missing.length) {
          throw new BadRequestException(
            `Para completar el mantenimiento faltan: ${missing.join(', ')}`,
          );
        }
        if (dto.finalMileage! < vehicle.mileage) {
          throw new BadRequestException(
            `El kilometraje final (${dto.finalMileage}) no puede ser menor al actual del vehículo (${vehicle.mileage})`,
          );
        }
        maintenance.workDone = dto.workDone!;
        maintenance.finalCost = dto.finalCost!;
        maintenance.finishedAt = new Date(dto.finishedAt!);
        maintenance.finalMileage = dto.finalMileage!;
        vehicle.mileage = dto.finalMileage!;
        vehicle.status = VehicleStatus.AVAILABLE;
        await manager.save(vehicle);
      }

      // Cancelling a job that had already started releases the vehicle.
      if (to === CANCELLED && from === IN_PROGRESS) {
        vehicle.status = VehicleStatus.AVAILABLE;
        await manager.save(vehicle);
      }

      maintenance.status = to;
      await manager.save(maintenance);
    });

    return this.findOne(id);
  }

  findAll(): Promise<Maintenance[]> {
    return this.repo.find({ relations: RELATIONS, order: { id: 'DESC' } });
  }

  findActive(): Promise<Maintenance[]> {
    return this.repo.find({
      where: { status: In(ACTIVE_STATUSES) },
      relations: RELATIONS,
      order: { scheduledDate: 'ASC' },
    });
  }

  async findByVehicle(vehicleId: number): Promise<Maintenance[]> {
    await this.assertVehicleExists(vehicleId);
    return this.repo.find({ where: { vehicleId }, relations: RELATIONS, order: { scheduledDate: 'DESC' } });
  }

  /** History = finished maintenances of the vehicle, most recent first. */
  async findHistoryByVehicle(vehicleId: number): Promise<Maintenance[]> {
    await this.assertVehicleExists(vehicleId);
    return this.repo.find({
      where: { vehicleId, status: COMPLETED },
      relations: RELATIONS,
      order: { finishedAt: 'DESC' },
    });
  }

  async findByMechanic(mechanicId: number): Promise<Maintenance[]> {
    if (!(await this.mechanicsRepo.existsBy({ id: mechanicId }))) {
      throw new NotFoundException(`Mecánico ${mechanicId} no encontrado`);
    }
    return this.repo.find({ where: { mechanicId }, relations: RELATIONS, order: { scheduledDate: 'DESC' } });
  }

  /** Maintenances assigned to the logged-in technician (with vehicle and workshop). */
  async findMine(actor: JwtPayload): Promise<Maintenance[]> {
    const mechanic = await this.mechanicsRepo.findOneBy({ userId: actor.sub });
    if (!mechanic) throw new NotFoundException('Tu usuario no está vinculado a un mecánico');
    return this.repo.find({
      where: { mechanicId: mechanic.id },
      relations: RELATIONS,
      order: { scheduledDate: 'DESC' },
    });
  }

  async findOneFor(id: number, actor: JwtPayload): Promise<Maintenance> {
    const maintenance = await this.findOne(id);
    await this.assertCanAccess(maintenance, actor);
    return maintenance;
  }

  private async findOne(id: number): Promise<Maintenance> {
    const maintenance = await this.repo.findOne({ where: { id }, relations: RELATIONS });
    if (!maintenance) throw new NotFoundException(`Mantenimiento ${id} no encontrado`);
    return maintenance;
  }

  private async assertVehicleExists(vehicleId: number) {
    if (!(await this.vehiclesRepo.existsBy({ id: vehicleId }))) {
      throw new NotFoundException(`Vehículo ${vehicleId} no encontrado`);
    }
  }

  /** ADMIN sees everything; a TECHNICIAN only the maintenances of their mechanic profile. */
  private async assertCanAccess(
    maintenance: Maintenance,
    actor: JwtPayload,
    manager: EntityManager = this.dataSource.manager,
  ) {
    if (actor.role === Role.ADMIN) return;
    const mechanic = await manager.findOneBy(Mechanic, { userId: actor.sub });
    if (!mechanic || mechanic.id !== maintenance.mechanicId) {
      throw new ForbiddenException('Este mantenimiento no está asignado a ti');
    }
  }
}
