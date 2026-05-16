import { Entity, Column, Index, CreateDateColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * Append-only audit trail for legally/financially sensitive actions
 * (serve, record edit, reject, refund).
 */
@Entity('audit_logs')
@Index(['business_id', 'entity', 'entity_id'])
@Index(['business_id', 'created_at'])
export class AuditLog extends BaseEntity {
  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  user_id: string | null;

  @Column({ type: 'varchar', length: 100, name: 'user_name', nullable: true })
  user_name: string | null;

  @Column({ type: 'varchar', length: 50, name: 'action' })
  action: string; // e.g. SERVE_NOTARY, UPDATE_RECORD, REJECT_BILL, PROCESS_REFUND

  @Column({ type: 'varchar', length: 50, name: 'entity' })
  entity: string; // e.g. notary_record, bill, refund

  @Column({ type: 'uuid', name: 'entity_id', nullable: true })
  entity_id: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'details' })
  details: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
