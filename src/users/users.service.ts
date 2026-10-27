import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async create(data: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }): Promise<User> {
    const email = data.email.toLowerCase();
    if (await this.usersRepository.existsBy({ email })) {
      throw new ConflictException(`El correo ${email} ya está registrado`);
    }
    const password = await bcrypt.hash(data.password, 10);
    const user = await this.usersRepository.save(
      this.usersRepository.create({ ...data, email, password }),
    );
    delete (user as Partial<User>).password;
    return user;
  }

  /** Includes the password hash (excluded by default) for credential checks. */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }
}
