import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { VehicleStatus } from '../../common/enums/vehicle-status.enum.js';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 15, unique: true })
  plate: string;

  @Column({ type: 'varchar', length: 60 })
  brand: string;

  @Column({ type: 'varchar', length: 60 })
  model: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  mileage: number;

  /** Logical delete: INACTIVE vehicles keep their maintenance history. */
  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.AVAILABLE })
  status: VehicleStatus;

  @CreateDateColumn()
  createdAt: Date;
}
