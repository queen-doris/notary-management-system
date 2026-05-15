import {
  Entity,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { RefundRequestStatus, RefundType } from '../enums/refund.enum';
import { Bill } from './bill.entity';

@Entity('refunds')
export class Refund extends BaseEntity {
  @Column({ type: 'uuid' })
  bill_id: string;

  @ManyToOne(() => Bill)
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;
  @Column({ type: 'varchar', length: 50 })
  bill_number: string;

  @Column({ type: 'varchar', length: 100 })
  client_name: string;

  @Column({ type: 'varchar', length: 100 })
  client_phone: string;

  @Column({ type: 'uuid', nullable: true })
  processed_by: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  processed_by_name: string;

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date;

  // Refund details
  @Column({ type: 'integer' })
  original_amount_paid: number;

  @Column({ type: 'integer' })
  requested_amount: number;

  @Column({ type: 'integer' })
  actual_refunded_amount: number;

  @Column({ type: 'enum', enum: RefundType })
  refund_type: RefundType;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Payment method for refund
  @Column({ type: 'varchar', length: 20, nullable: true })
  refund_method: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transaction_reference: string;

  // Status tracking
  @Column({
    type: 'enum',
    enum: RefundRequestStatus,
    default: RefundRequestStatus.PENDING,
  })
  status: RefundRequestStatus;

  // Who requested/processed
  @Column({ type: 'uuid', nullable: true })
  requested_by: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  requested_by_name: string;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  approved_by_name: string;

  // Timestamps
  @CreateDateColumn()
  requested_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date;
}
