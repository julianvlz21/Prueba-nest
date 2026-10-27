import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkshopStatus } from '../common/enums/workshop-status.enum.js';
import { CreateWorkshopDto } from './dto/create-workshop.dto.js';
import { UpdateWorkshopDto } from './dto/update-workshop.dto.js';
import { Workshop } from './entities/workshop.entity.js';

@Injectable()
export class WorkshopsService {
  constructor(@InjectRepository(Workshop) private readonly repo: Repository<Workshop>) {}

  create(dto: CreateWorkshopDto): Promise<Workshop> {
    return this.repo.save(this.repo.create(dto));
  }

  findAll(): Promise<Workshop[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  findActive(): Promise<Workshop[]> {
    return this.repo.find({ where: { status: WorkshopStatus.ACTIVE }, order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Workshop> {
    const workshop = await this.repo.findOneBy({ id });
    if (!workshop) throw new NotFoundException(`Taller ${id} no encontrado`);
    return workshop;
  }

  async update(id: number, dto: UpdateWorkshopDto): Promise<Workshop> {
    return this.repo.save(Object.assign(await this.findOne(id), dto));
  }

  async setStatus(id: number, status: WorkshopStatus): Promise<Workshop> {
    const workshop = await this.findOne(id);
    workshop.status = status;
    return this.repo.save(workshop);
  }
}
