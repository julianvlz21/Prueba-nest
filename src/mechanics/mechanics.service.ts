import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MechanicStatus } from '../common/enums/mechanic-status.enum.js';
import { Role } from '../common/enums/role.enum.js';
import { UsersService } from '../users/users.service.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import { UpdateMechanicDto } from './dto/update-mechanic.dto.js';
import { Mechanic } from './entities/mechanic.entity.js';

@Injectable()
export class MechanicsService {
  constructor(
    @InjectRepository(Mechanic) private readonly repo: Repository<Mechanic>,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateMechanicDto): Promise<Mechanic> {
    const email = dto.email.toLowerCase();
    await this.assertEmailFree(email);
    if (dto.userId !== undefined) await this.assertLinkableUser(dto.userId);
    return this.repo.save(this.repo.create({ ...dto, email, userId: dto.userId ?? null }));
  }

  findAll(): Promise<Mechanic[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Mechanic> {
    const mechanic = await this.repo.findOneBy({ id });
    if (!mechanic) throw new NotFoundException(`Mecánico ${id} no encontrado`);
    return mechanic;
  }

  /** Mechanic profile of the logged-in TECHNICIAN user. */
  async findByUserId(userId: number): Promise<Mechanic> {
    const mechanic = await this.repo.findOneBy({ userId });
    if (!mechanic) throw new NotFoundException('Tu usuario no está vinculado a un mecánico');
    return mechanic;
  }

  async update(id: number, dto: UpdateMechanicDto): Promise<Mechanic> {
    const mechanic = await this.findOne(id);
    if (dto.email) {
      dto.email = dto.email.toLowerCase();
      if (dto.email !== mechanic.email) await this.assertEmailFree(dto.email);
    }
    if (dto.userId !== undefined && dto.userId !== mechanic.userId) {
      await this.assertLinkableUser(dto.userId);
    }
    return this.repo.save(Object.assign(mechanic, dto));
  }

  /** Activate/deactivate instead of deleting, so maintenance history is preserved. */
  async setStatus(id: number, status: MechanicStatus): Promise<Mechanic> {
    const mechanic = await this.findOne(id);
    mechanic.status = status;
    return this.repo.save(mechanic);
  }

  private async assertEmailFree(email: string) {
    if (await this.repo.existsBy({ email })) {
      throw new ConflictException(`Ya existe un mecánico con el correo ${email}`);
    }
  }

  private async assertLinkableUser(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException(`Usuario ${userId} no encontrado`);
    if (user.role !== Role.TECHNICIAN) {
      throw new BadRequestException('Solo se puede vincular un usuario con rol TECHNICIAN');
    }
    if (await this.repo.existsBy({ userId })) {
      throw new ConflictException(`El usuario ${userId} ya está vinculado a otro mecánico`);
    }
  }
}
