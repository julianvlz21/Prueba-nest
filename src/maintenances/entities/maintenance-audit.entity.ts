import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MaintenanceStatus } from '../../common/enums/maintenance-status.enum.js';
import { Maintenance } from './maintenance.entity.js';

/** One row per status change of a maintenance (creation is recorded as null -> SCHEDULED). */
@Entity('maintenance_audits')
export class MaintenanceAudit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  maintenanceId: number;

  @ManyToOne(() => Maintenance, { nullable: false })
  @JoinColumn({ name: 'maintenanceId' })
  maintenance?: Maintenance;

  @Column({ type: 'enum', enum: MaintenanceStatus, nullable: true })
  fromStatus: MaintenanceStatus | null;

  @Column({ type: 'enum', enum: MaintenanceStatus })
  toStatus: MaintenanceStatus;

  /** Who made the change (id and email are copied so the log survives user changes). */
  @Column({ type: 'int' })
  changedById: number;

  @Column({ type: 'varchar', length: 150 })
  changedByEmail: string;

  @CreateDateColumn()
  changedAt: Date;
}
