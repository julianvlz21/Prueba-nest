import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleStatus } from '../common/enums/vehicle-status.enum.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { Vehicle } from './entities/vehicle.entity.js';

@Injectable()
export class VehiclesService {
  constructor(@InjectRepository(Vehicle) private readonly repo: Repository<Vehicle>) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    const plate = dto.plate.toUpperCase();
    await this.assertPlateFree(plate);
    return this.repo.save(this.repo.create({ ...dto, plate }));
  }

  findAll(): Promise<Vehicle[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.repo.findOneBy({ id });
    if (!vehicle) throw new NotFoundException(`Vehículo ${id} no encontrado`);
    return vehicle;
  }

  async findByPlate(plate: string): Promise<Vehicle> {
    const vehicle = await this.repo.findOneBy({ plate: plate.toUpperCase() });
    if (!vehicle) throw new NotFoundException(`Vehículo con placa ${plate.toUpperCase()} no encontrado`);
    return vehicle;
  }

  async update(id: number, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    if (dto.plate) {
      dto.plate = dto.plate.toUpperCase();
      if (dto.plate !== vehicle.plate) await this.assertPlateFree(dto.plate);
    }
    return this.repo.save(Object.assign(vehicle, dto));
  }

  async deactivate(id: number): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    if (vehicle.status === VehicleStatus.IN_MAINTENANCE) {
      throw new ConflictException(
        `El vehículo ${vehicle.plate} está en mantenimiento y no puede inactivarse`,
      );
    }
    vehicle.status = VehicleStatus.INACTIVE;
    return this.repo.save(vehicle);
  }

  async activate(id: number): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    if (vehicle.status !== VehicleStatus.INACTIVE) {
      throw new ConflictException(`El vehículo ${vehicle.plate} ya está activo`);
    }
    vehicle.status = VehicleStatus.AVAILABLE;
    return this.repo.save(vehicle);
  }

  private async assertPlateFree(plate: string) {
    if (await this.repo.existsBy({ plate })) {
      throw new ConflictException(`Ya existe un vehículo con la placa ${plate}`);
    }
  }
}
