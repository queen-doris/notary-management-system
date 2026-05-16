import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Business } from './business.entity';
import { BaseEntity } from './base.entity';
import { ReportType } from '../enums/report-type.enum';

/**
 * A previously-produced report (Minijust / financial / etc.) uploaded
 * as a PDF or Excel so historical reports live alongside generated ones.
 */
@Entity('report_archives')
@Index(['business_id', 'report_type'])
export class ReportArchive extends BaseEntity {
  @Column({ type: 'enum', enum: ReportType, name: 'report_type' })
  report_type: ReportType;

  @Column({ type: 'date', nullable: true, name: 'period_start' })
  period_start: string | null;

  @Column({ type: 'date', nullable: true, name: 'period_end' })
  period_end: string | null;

  @Column({ type: 'varchar', length: 255, name: 'file_name' })
  file_name: string;

  @Column({ type: 'varchar', length: 500, name: 'file_url' })
  file_url: string;

  @Column({ type: 'varchar', length: 255, name: 'public_id' })
  public_id: string;

  @Column({ type: 'varchar', length: 100, name: 'mime_type' })
  mime_type: string;

  @Column({ type: 'integer', name: 'file_size' })
  file_size: number;

  @Column({ type: 'text', nullable: true, name: 'notes' })
  notes: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'uuid', name: 'uploaded_by' })
  uploaded_by: string;

  @Column({ type: 'varchar', length: 100, name: 'uploaded_by_name' })
  uploaded_by_name: string;

  @Column({ type: 'uuid', name: 'business_id' })
  business_id: string;

  @ManyToOne(() => Business)
  @JoinColumn({ name: 'business_id' })
  business: Business;
}
