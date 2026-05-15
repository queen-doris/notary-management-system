/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { BusinessUser } from './business-user.entity';
import { EBusinessType } from '../enums/business-type.enum';
import { EWorkingDays } from '../enums/working-days.enum';

@Entity('business')
export class Business extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  ownerUserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'ownerUserId' })
  ownerUser?: User;

  @Column({ type: 'varchar' })
  businessName: string;

  @Column({ type: 'enum', enum: EBusinessType })
  businessType: EBusinessType;

  @Column({ type: 'varchar', unique: true })
  businessRegistrationNumber: string;

  @Column({ type: 'varchar', unique: true })
  tinNumber: string;

  @Column({ type: 'varchar' })
  province: string;

  @Column({ type: 'varchar' })
  district: string;

  @Column({ type: 'varchar' })
  sector: string;

  @Column({ type: 'varchar' })
  cell: string;

  @Column({ type: 'varchar', nullable: true })
  village?: string;

  @Column({ type: 'varchar', nullable: true })
  address?: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  phone?: string;

  @Column({ type: 'varchar', nullable: true })
  website?: string;

  @Column({ type: 'varchar', nullable: true })
  logoUrl?: string;

  @Column({ type: 'varchar', nullable: true })
  coverImageUrl?: string;

  @Column({ type: 'simple-array', nullable: true })
  workingDays?: EWorkingDays[];

  @Column({ type: 'varchar', nullable: true })
  timezone?: string;

  @Column({ type: 'time', nullable: true })
  openingTime: string;

  @Column({ type: 'time', nullable: true })
  closingTime: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  is24Hours: boolean;

  @Column({ type: 'varchar', nullable: true })
  vatRate?: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  vatRegistered: boolean;

  @Column({ type: 'varchar', nullable: true })
  healthPermitNumber?: string;

  @Column({ type: 'date', nullable: true })
  healthPermitExpiry?: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  annualTurnover?: number; // Annual turnover in RWF (for quarterly filing eligibility)

  @Column({ type: 'varchar', nullable: true })
  fireSafetyCertificate?: string;

  @Column({ type: 'integer', default: 0 })
  numberOfEmployees?: number;

  @Column({ type: 'varchar', nullable: true })
  mobileMoney?: string;

  @Column({ type: 'varchar', nullable: true })
  bankName?: string;

  @Column({ type: 'varchar', nullable: true })
  bankAccountNumber?: string;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  // Whether this notary office also offers secretariat services.
  // Defaults to true so existing businesses keep working; new
  // registrations set it explicitly.
  @Column({ type: 'boolean', default: true })
  has_secretariat: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'simple-array', nullable: true })
  services?: string[];

  @Column({ type: 'varchar', nullable: true })
  emergencyContactPhone?: string;

  @OneToMany(() => BusinessUser, (businessUser) => businessUser.business, {
    cascade: false,
    eager: false,
  })
  businessUsers: BusinessUser[];
}
