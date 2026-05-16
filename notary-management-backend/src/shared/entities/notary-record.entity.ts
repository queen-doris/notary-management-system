import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Relation,
} from 'typeorm';
import { Client } from './client.entity';
import { Business } from './business.entity';
import { Bill } from './bill.entity';
import { Book } from './book.entity';
import { Document } from './document.entity';
import { RecordStatus } from '../enums/record-status.enum';
import { MaritalStatus, VerificationStatus } from '../enums/client.enum';
import { BaseEntity } from './base.entity';
import { BusinessUser } from './business-user.entity';

@Entity('notary_records')
@Index(['book_type', 'business_id'])
@Index(['record_number', 'business_id'])
@Index(['client_id', 'business_id'])
@Index(['served_date'])
@Index(['client_full_name'])
@Index(['client_id_number'])
// A record number is unique within a book + volume for a business.
// `volume` is normalised to '' (never null) so this also enforces
// uniqueness for volume-less books.
@Index(['business_id', 'book_id', 'volume', 'record_number'], {
  unique: true,
})
export class NotaryRecord extends BaseEntity {
  // ============================================
  // Book Information (book_type kept as a denormalized
  // slug snapshot; book_id is the joinable FK)
  // ============================================
  @Column({ type: 'varchar', length: 50, name: 'book_type' })
  book_type: string;

  @Column({ type: 'uuid', nullable: true, name: 'book_id' })
  book_id: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'volume' })
  volume: string | null;

  @Column({ type: 'varchar', length: 50, name: 'record_number' })
  record_number: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'display_number',
  })
  display_number: string;

  // ============================================
  // Service Information
  // ============================================
  @Column({ type: 'varchar', length: 50, name: 'service_category' })
  service_category: string;

  @Column({ type: 'varchar', length: 100, name: 'sub_service' })
  sub_service: string;

  // `amount` is the line subtotal (unit_price * quantity, pre-VAT).
  @Column({ type: 'integer', name: 'amount' })
  amount: number;

  @Column({ type: 'integer', default: 0, name: 'vat_amount' })
  vat_amount: number;

  @Column({ type: 'integer', nullable: true, name: 'quantity' })
  quantity: number | null;

  @Column({ type: 'integer', nullable: true, name: 'unit_price' })
  unit_price: number | null;

  @Column({ type: 'integer', nullable: true, name: 'grand_total' })
  grand_total: number | null;

  // ============================================
  // Client Information (Denormalized - captured at service time)
  // ============================================
  // Nullable: imported historical records keep only the denormalized
  // client name/ID, not a live Client row.
  @Column({ type: 'uuid', name: 'client_id', nullable: true })
  client_id: string | null;

  // Basic Information
  @Column({ type: 'varchar', length: 100, name: 'client_full_name' })
  client_full_name: string;

  @Column({ type: 'varchar', length: 50, name: 'client_id_number' })
  client_id_number: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'client_phone' })
  client_phone: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'client_email',
  })
  client_email: string;

  // Parent Information
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'client_father_name',
  })
  client_father_name: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'client_mother_name',
  })
  client_mother_name: string;

  // Address Information
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'client_province',
  })
  client_province: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'client_district',
  })
  client_district: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'client_sector',
  })
  client_sector: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'client_cell' })
  client_cell: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'client_village',
  })
  client_village: string;

  // Personal Information
  @Column({ type: 'date', nullable: true, name: 'client_date_of_birth' })
  client_date_of_birth: Date;

  @Column({
    type: 'enum',
    enum: MaritalStatus,
    default: MaritalStatus.SINGLE,
    name: 'client_marital_status',
  })
  client_marital_status: MaritalStatus;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'client_partner_name',
  })
  client_partner_name: string;

  // UPI (Unique Parcel Identifier for land records)
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'upi' })
  upi: string;

  // Verification Status at time of service
  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
    name: 'client_verification_status',
  })
  client_verification_status: VerificationStatus;

  // ============================================
  // Additional Information
  // ============================================
  @Column({ type: 'text', nullable: true, name: 'document_description' })
  document_description: string;

  @Column({ type: 'text', nullable: true, name: 'notary_notes' })
  notary_notes: string;

  // ============================================
  // Status & Tracking
  // ============================================
  @Column({
    type: 'enum',
    enum: RecordStatus,
    default: RecordStatus.ACTIVE,
    name: 'status',
  })
  status: RecordStatus;

  @Column({ type: 'uuid', name: 'served_by', nullable: true })
  served_by: string | null;

  @Column({ type: 'timestamp', name: 'served_date' })
  served_date: Date;

  @Column({ type: 'boolean', default: false, name: 'has_documents' })
  has_documents: boolean;

  // True for records imported from a historical Excel/spreadsheet
  // (no originating bill in this system).
  @Column({ type: 'boolean', default: false, name: 'is_imported' })
  is_imported: boolean;

  // ============================================
  // Bill Reference (nullable: imported historical records have no bill)
  // ============================================
  @Column({ type: 'uuid', name: 'bill_id', nullable: true })
  bill_id: string | null;

  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  // ============================================
  // Relationships (for joins if needed)
  // ============================================
  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ManyToOne(() => Bill)
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;

  @ManyToOne(() => BusinessUser)
  @JoinColumn({ name: 'served_by' })
  server: BusinessUser;

  @ManyToOne(() => Book)
  @JoinColumn({ name: 'book_id' })
  book: Book | null;

  @OneToMany(() => Document, (document) => document.record)
  attachments: Relation<Document[]>;
}
