import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Business } from './business.entity';
import { NotaryRecord } from './notary-record.entity';
import { MaritalStatus, VerificationStatus } from '../enums/client.enum';
import { BaseEntity } from './base.entity';
import { Bill } from './bill.entity';

@Entity('clients')
@Index(['id_number', 'business_id'], { unique: true })
@Index(['full_name', 'business_id'])
@Index(['phone', 'business_id'])
export class Client extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  client_id: string;

  // Basic Information
  @Column({ type: 'varchar', length: 100 })
  full_name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  id_number: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  // Parent Information
  @Column({ type: 'varchar', length: 100, nullable: true })
  father_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mother_name: string;

  // Address Information
  @Column({ type: 'varchar', length: 100, nullable: true })
  province: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sector: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cell: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  village: string;

  // Personal Information
  @Column({ type: 'date', nullable: true })
  date_of_birth: Date;

  @Column({ type: 'enum', enum: MaritalStatus, default: MaritalStatus.SINGLE })
  marital_status: MaritalStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  partner_name: string; // Current spouse or ex-partner

  // UPI (Unique Parcel Identifier for land records)
  @Column({ type: 'varchar', length: 100, nullable: true })
  upi: string;

  // Verification
  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verification_status: VerificationStatus;

  @Column({ type: 'text', nullable: true })
  verification_notes: string;

  @Column({ type: 'timestamp', nullable: true })
  verified_at: Date;

  @Column({ type: 'uuid', nullable: true })
  verified_by: string;

  // Business Relation
  @Column({ type: 'uuid' })
  business_id: string;

  // Additional Info
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  // Soft delete
  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  // Relationships
  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @OneToMany(() => Bill, (bill) => bill.client)
  bills: Bill[];

  @OneToMany(() => NotaryRecord, (record) => record.client)
  notary_records: NotaryRecord[];
}
