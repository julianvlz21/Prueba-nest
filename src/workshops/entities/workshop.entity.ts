import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { WorkshopStatus } from '../../common/enums/workshop-status.enum.js';

@Entity('workshops')
export class Workshop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 200 })
  address: string;

  @Column({ type: 'enum', enum: WorkshopStatus, default: WorkshopStatus.ACTIVE })
  status: WorkshopStatus;

  @CreateDateColumn()
  createdAt: Date;
}
