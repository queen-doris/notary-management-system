import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Bill } from './bill.entity';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';
import { PaymentMethod } from '../enums/bill-status.enum';
import { PaymentStatus } from '../enums/bill-status.enum';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ type: 'uuid' })
  bill_id: string;

  // Denormalized bill info (for quick access)
  @Column({ type: 'varchar', length: 50 })
  bill_number: string;

  @Column({ type: 'varchar', length: 100 })
  client_name: string;

  // Payment details
  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference: string; // Transaction ID for bank/momo

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.COMPLETED,
  })
  status: PaymentStatus;

  // Who processed this payment
  @Column({ type: 'uuid' })
  processed_by: string;

  @Column({ type: 'varchar', length: 100 })
  processed_by_name: string;

  @Column({ type: 'varchar', length: 50 })
  processed_by_role: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  processed_at: Date;

  @Column({ type: 'integer', nullable: true })
  refunded_amount: number;

  @Column({ type: 'timestamp', nullable: true })
  refunded_at: Date;

  @Column({ type: 'uuid', nullable: true })
  refunded_by: string;

  @Column({ type: 'text', nullable: true })
  refund_reason: string;

  // Relationships (optional, for deeper queries)
  @ManyToOne(() => Bill)
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'processed_by' })
  processor: User;
}
