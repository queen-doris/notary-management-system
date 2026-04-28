import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('refunds')
export class Refund extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  bill_number: string;

  @Column({ type: 'varchar', length: 100 })
  client_name: string;

  @Column({ type: 'integer' })
  original_amount: number;

  @Column({ type: 'integer' })
  refund_amount: number;

  @Column({ type: 'text', nullable: true })
  refund_reason: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  refund_type: string;

  @Column({ type: 'uuid' })
  processed_by: string;

  @Column({ type: 'varchar', length: 100 })
  processed_by_name: string;

  @Column({ type: 'timestamp' })
  processed_at: Date;
}
