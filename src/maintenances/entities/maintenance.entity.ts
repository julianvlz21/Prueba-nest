import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MaintenanceStatus } from '../../common/enums/maintenance-status.enum.js';
import { MaintenanceType } from '../../common/enums/maintenance-type.enum.js';
import { numericTransformer } from '../../common/transformers/numeric.transformer.js';
import { Mechanic } from '../../mechanics/entities/mechanic.entity.js';
import { Vehicle } from '../../vehicles/entities/vehicle.entity.js';
import { Workshop } from '../../workshops/entities/workshop.entity.js';

@Entity('maintenances')
export class Maintenance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: MaintenanceType })
  type: MaintenanceType;

  @Column({ type: 'text' })
  description: string;

  /** Odometer reading when the maintenance is requested; must be >= the vehicle's mileage. */
  @Column({ type: 'int' })
  mileage: number;

  /** Scheduled window [scheduledDate, scheduledEndDate); used to detect mechanic overlaps. */
  @Column({ type: 'timestamptz' })
  scheduledDate: Date;

  @Column({ type: 'timestamptz' })
  scheduledEndDate: Date;

  @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.SCHEDULED })
  status: MaintenanceStatus;

  // Closing data, required when moving to COMPLETED.
  @Column({ type: 'text', nullable: true })
  workDone: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true, transformer: numericTransformer })
  finalCost: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  finalMileage: number | null;

  @Column({ type: 'int' })
  vehicleId: number;

  @Column({ type: 'int' })
  mechanicId: number;

  @Column({ type: 'int' })
  workshopId: number;

  @ManyToOne(() => Vehicle, { nullable: false })
  @JoinColumn({ name: 'vehicleId' })
  vehicle?: Vehicle;

  @ManyToOne(() => Mechanic, { nullable: false })
  @JoinColumn({ name: 'mechanicId' })
  mechanic?: Mechanic;

  @ManyToOne(() => Workshop, { nullable: false })
  @JoinColumn({ name: 'workshopId' })
  workshop?: Workshop;

  @CreateDateColumn()
  createdAt: Date;
}
