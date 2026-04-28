import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Client } from './client.entity';
import { Business } from './business.entity';
import { User } from './user.entity';
import { BillItem } from './bill-item.entity';
import { BillStatus, BillType } from '../enums/bill-status.enum';
import { MaritalStatus, VerificationStatus } from '../enums/client.enum';
import { BaseEntity } from './base.entity';

@Entity('bills')
export class Bill extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  bill_number: string;

  @Column({ type: 'enum', enum: BillType })
  bill_type: BillType;

  // ============================================
  // Client Information (Denormalized - captured at bill creation)
  // This ensures bill prints correctly even if client updates their info later
  // ============================================
  @Column({ type: 'uuid' })
  client_id: string;

  @Column({ type: 'varchar', length: 100 })
  client_full_name: string;

  @Column({ type: 'varchar', length: 50 })
  client_id_number: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  client_father_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  client_mother_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  client_phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  client_email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  client_province: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  client_district: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  client_sector: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  client_cell: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  client_village: string;

  @Column({ type: 'date', nullable: true })
  client_date_of_birth: Date;

  @Column({ type: 'enum', enum: MaritalStatus, default: MaritalStatus.SINGLE })
  client_marital_status: MaritalStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  client_partner_name: string;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  client_verification_status: VerificationStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  client_upi: string; // Unique Parcel Identifier for land

  // ============================================
  // Business Information
  // ============================================
  @Column({ type: 'uuid' })
  business_id: string;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @Column({ type: 'boolean', default: true })
  is_created_by_staff: boolean;

  // ============================================
  // Financial Totals
  // ============================================
  @Column({ type: 'integer' })
  notary_subtotal: number;

  @Column({ type: 'integer', default: 0 })
  notary_vat: number;

  @Column({ type: 'integer', default: 0 })
  notary_total: number;

  @Column({ type: 'integer', default: 0 })
  secretariat_subtotal: number;

  @Column({ type: 'integer', default: 0 })
  secretariat_total: number;

  @Column({ type: 'integer' })
  grand_total: number;

  // ============================================
  // Status
  // ============================================
  @Column({ type: 'enum', enum: BillStatus, default: BillStatus.PENDING })
  status: BillStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ type: 'text', nullable: true })
  rejection_notes: string;

  @Column({ type: 'uuid', nullable: true })
  rejected_by: string;

  @Column({ type: 'timestamp', nullable: true })
  rejected_at: Date;

  // payment tracking

  @Column({ type: 'integer', default: 0 })
  amount_paid: number;

  @Column({ type: 'integer', default: 0 })
  remaining_balance: number;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;

  @Column({ type: 'uuid', nullable: true })
  paid_by: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paid_by_name: string;

  // ============================================
  // Relationships (for joins when needed)
  // ============================================
  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => BillItem, (item) => item.bill, { cascade: true })
  items: BillItem[];
}
