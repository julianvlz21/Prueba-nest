import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MechanicStatus } from '../../common/enums/mechanic-status.enum.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('mechanics')
export class Mechanic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  specialty: string;

  /** Inactive mechanics keep their history but cannot receive new maintenances. */
  @Column({ type: 'enum', enum: MechanicStatus, default: MechanicStatus.ACTIVE })
  status: MechanicStatus;

  /** Optional link to the TECHNICIAN user who logs in as this mechanic. */
  @Column({ type: 'int', nullable: true, unique: true })
  userId: number | null;

  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
