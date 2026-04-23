/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Business } from './business.entity';
import { EEmploymentStatus } from '../enums/employee-status.enum';
import { EBusinessRole } from '../enums/business-role.enum';

@Entity('business_users')
@Index(['businessId', 'userId'], { unique: true })
@Index(['businessId', 'staffCode'], { unique: true })
export class BusinessUser extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid' })
  businessId: string;

  @Column({
    type: 'enum',
    enum: EBusinessRole,
    array: true,
  })
  roles: EBusinessRole[];

  @Column({ type: 'varchar', length: 6, nullable: true })
  staffCode?: string;

  @Column({
    type: 'enum',
    enum: EEmploymentStatus,
    default: EEmploymentStatus.ACTIVE,
  })
  employmentStatus: EEmploymentStatus;

  @Column({ type: 'date', nullable: true })
  hireDate?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  jobTitle?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salary?: number;

  @Column({ type: 'boolean', default: false })
  isClockedIn: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastClockInAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastClockOutAt?: Date;
}
