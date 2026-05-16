import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Client } from './client.entity';
import { Business } from './business.entity';
import { Bill } from './bill.entity';
import { RecordStatus } from '../enums/record-status.enum';
import { BaseEntity } from './base.entity';
import { BusinessUser } from './business-user.entity';

@Entity('secretariat_records')
@Index(['business_id'])
@Index(['client_id', 'business_id'])
@Index(['served_date'])
@Index(['client_full_name'])
@Index(['client_id_number'])
export class SecretariatRecord extends BaseEntity {
  // Service info
  @Column({ type: 'varchar', length: 100, name: 'service_name' })
  service_name: string;

  @Column({ type: 'integer', name: 'quantity', default: 1 })
  quantity: number;

  @Column({ type: 'integer', name: 'unit_price' })
  unit_price: number;

  @Column({ type: 'integer', name: 'subtotal' })
  subtotal: number;

  @Column({ type: 'integer', name: 'total' })
  total: number;

  // Client snapshot (denormalized at serve time)
  @Column({ type: 'uuid', name: 'client_id' })
  client_id: string;

  @Column({ type: 'varchar', length: 100, name: 'client_full_name' })
  client_full_name: string;

  @Column({ type: 'varchar', length: 50, name: 'client_id_number' })
  client_id_number: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'client_phone',
  })
  client_phone: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'client_email',
  })
  client_email: string;

  @Column({ type: 'text', nullable: true, name: 'notes' })
  notes: string;

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

  @Column({ type: 'boolean', default: false, name: 'is_imported' })
  is_imported: boolean;

  @Column({ type: 'uuid', name: 'bill_id', nullable: true })
  bill_id: string | null;

  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @ManyToOne(() => Bill)
  @JoinColumn({ name: 'bill_id' })
  bill: Bill | null;

  @ManyToOne(() => BusinessUser)
  @JoinColumn({ name: 'served_by' })
  server: BusinessUser | null;
}
